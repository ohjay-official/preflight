import type { Address } from "viem";
import {
  normalizeTokenTransfer,
  normalizeTransaction,
  oldestTimestamp,
  rowsFromBody,
  tokenIdFromRow,
} from "@/lib/activity/parse";
import { blockscoutV2Origin, readBlockscoutV2 } from "@/lib/activity/blockscout-v2";
import { readIncomingTokenLogs, type TokenLogRead } from "@/lib/activity/token-logs";
import type { AccountActivity, ActivitySource, NormalizedTokenTransfer, NormalizedTx } from "@/lib/activity/types";
import { errorMessage } from "@/lib/format";
import { requestWithBackoff, type RetryOptions } from "@/lib/http";

const PAGE_SIZE = 100;
const MAX_PAGES = 15;

export type TokenLogReader = {
  read(address: Address, sinceUnix: number): Promise<TokenLogRead>;
};

export type BlockscoutOptions = {
  fetchImpl?: typeof fetch;
  backoffMs?: number[];
  tokenLogs?: TokenLogReader;
};

export class BlockscoutActivitySource implements ActivitySource {
  readonly label = "Blockscout";

  constructor(
    private readonly baseUrl: string,
    private readonly options: BlockscoutOptions = {},
  ) {}

  async getAccountActivity(address: Address, sinceUnix: number): Promise<AccountActivity> {
    const [initialNative, initialTokens, initialInternal] = await Promise.all([
      this.fetchSafe("txlist", address, sinceUnix),
      this.fetchSafe("tokentx", address, sinceUnix),
      this.fetchSafe("txlistinternal", address, sinceUnix, undefined, 4_000),
    ]);
    let transactions = initialNative;
    let tokenTransfers = initialTokens;
    let internal = initialInternal;

    let normalizedNative: NormalizedTx[] | null = null;
    let normalizedTokens: NormalizedTokenTransfer[] | null = null;
    let normalizedInternal: NormalizedTx[] | null = null;
    let tokenTruncated = tokenTransfers.truncated;
    const needsV2 = !transactions.read || !tokenTransfers.read || !internal.read;
    if (needsV2) {
      try {
        const v2 = await readBlockscoutV2(blockscoutV2Origin(this.baseUrl), address, sinceUnix, {
          fetchImpl: this.options.fetchImpl,
          backoffMs: this.options.backoffMs,
        });
        if (!transactions.read) {
          transactions = { rows: [], truncated: v2.truncated, read: true };
          normalizedNative = v2.transactions;
        }
        if (!tokenTransfers.read) {
          normalizedTokens = v2.tokenTransfers;
          tokenTransfers = { rows: [], truncated: v2.truncated, read: true };
          tokenTruncated = v2.truncated;
        }
        if (!internal.read) {
          internal = { rows: [], truncated: v2.truncated, read: true };
          normalizedInternal = v2.internalTransactions;
        }
      } catch {
        // Classic and v2 both failed for at least one list. RPC logs are next for tokens.
      }
    }

    if (!tokenTransfers.read) {
      const fallback = await this.readTokenLogs(address, sinceUnix);
      if (fallback) {
        normalizedTokens = fallback.transfers;
        tokenTransfers = {
          rows: [],
          truncated: !fallback.complete,
          read: true,
          error: fallback.complete ? undefined : "ERC-20 RPC log scan covered only part of the 30 day window.",
        };
        tokenTruncated = !fallback.complete;
      }
    }

    if (!transactions.read && !tokenTransfers.read) {
      throw new Error(
        transactions.error || tokenTransfers.error || "Payment history could not be read.",
      );
    }

    return {
      transactions:
        normalizedNative ??
        transactions.rows
          .map(normalizeTransaction)
          .filter((row): row is NonNullable<typeof row> => row !== null),
      tokenTransfers:
        normalizedTokens ??
        tokenTransfers.rows
          .map(normalizeTokenTransfer)
          .filter((row): row is NonNullable<typeof row> => row !== null),
      internalTransactions:
        normalizedInternal ??
        internal.rows
          .map(normalizeTransaction)
          .filter((row): row is NonNullable<typeof row> => row !== null),
      truncated: transactions.truncated || tokenTruncated || internal.truncated,
      internalRead: internal.read,
      nativeRead: transactions.read,
      tokenRead: tokenTransfers.read,
      nativeError: transactions.error,
      tokenError: tokenTransfers.error,
      internalError: internal.error,
    };
  }

  async getIdentityTokenIds(
    address: Address,
    registry: Address,
  ): Promise<{ tokenIds: bigint[]; truncated: boolean }> {
    const fetched = await this.fetchAction("tokennfttx", address, 0, {
      contractaddress: registry,
    });
    const ids = new Set<string>();
    for (const row of fetched.rows) {
      const id = tokenIdFromRow(row);
      if (id !== null) ids.add(id.toString());
    }
    return {
      tokenIds: [...ids].map((id) => BigInt(id)),
      truncated: fetched.truncated,
    };
  }

  private async fetchSafe(
    action: string,
    address: Address,
    sinceUnix: number,
    extra?: Record<string, string>,
    timeoutMs = 12_000,
  ): Promise<{ rows: Record<string, string>[]; truncated: boolean; read: boolean; error?: string }> {
    try {
      const result = await this.fetchAction(action, address, sinceUnix, extra, timeoutMs);
      return { ...result, read: true };
    } catch (error) {
      return { rows: [], truncated: false, read: false, error: errorMessage(error) };
    }
  }

  private async fetchAction(
    action: string,
    address: Address,
    sinceUnix: number,
    extra?: Record<string, string>,
    timeoutMs = 12_000,
  ): Promise<{ rows: Record<string, string>[]; truncated: boolean }> {
    const rows: Record<string, string>[] = [];
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const url = new URL(this.baseUrl);
      url.searchParams.set("module", "account");
      url.searchParams.set("action", action);
      url.searchParams.set("address", address);
      url.searchParams.set("page", String(page));
      url.searchParams.set("offset", String(PAGE_SIZE));
      url.searchParams.set("sort", "desc");
      for (const [key, value] of Object.entries(extra ?? {})) {
        url.searchParams.set(key, value);
      }
      const response = await this.fetchWithRetry(url.toString(), timeoutMs);
      const pageRows = rowsFromBody(await response.json());
      rows.push(...pageRows);
      if (pageRows.length < PAGE_SIZE) return { rows, truncated: false };
      const oldest = oldestTimestamp(pageRows);
      if (oldest !== null && oldest < sinceUnix) return { rows, truncated: false };
      if (page === MAX_PAGES) return { rows, truncated: true };
    }
    return { rows, truncated: true };
  }

  private fetchWithRetry(url: string, timeoutMs: number): Promise<Response> {
    const retry: RetryOptions = {
      attempts: 3,
      backoffMs: this.options.backoffMs ?? [250, 750],
      fetchImpl: this.options.fetchImpl,
    };
    return requestWithBackoff(url, timeoutMs, retry);
  }

  private async readTokenLogs(address: Address, sinceUnix: number): Promise<TokenLogRead | null> {
    const reader = this.options.tokenLogs ?? { read: readIncomingTokenLogs };
    try {
      return await reader.read(address, sinceUnix);
    } catch {
      return null;
    }
  }
}
