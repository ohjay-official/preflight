import type { Address } from "viem";
import {
  normalizeTokenTransfer,
  normalizeTransaction,
  oldestTimestamp,
  rowsFromBody,
  tokenIdFromRow,
} from "@/lib/activity/parse";
import type { AccountActivity, ActivitySource } from "@/lib/activity/types";
import { errorMessage } from "@/lib/format";

const PAGE_SIZE = 100;
const MAX_PAGES = 8;

export class BlockscoutActivitySource implements ActivitySource {
  readonly label = "Blockscout";

  constructor(private readonly baseUrl: string) {}

  async getAccountActivity(address: Address, sinceUnix: number): Promise<AccountActivity> {
    const [transactions, tokenTransfers, internal] = await Promise.all([
      this.fetchSafe("txlist", address, sinceUnix),
      this.fetchSafe("tokentx", address, sinceUnix),
      this.fetchSafe("txlistinternal", address, sinceUnix, undefined, 6_000),
    ]);

    if (!transactions.read && !tokenTransfers.read) {
      throw new Error(
        transactions.error || tokenTransfers.error || "Payment history could not be read.",
      );
    }

    return {
      transactions: transactions.rows
        .map(normalizeTransaction)
        .filter((row): row is NonNullable<typeof row> => row !== null),
      tokenTransfers: tokenTransfers.rows
        .map(normalizeTokenTransfer)
        .filter((row): row is NonNullable<typeof row> => row !== null),
      internalTransactions: internal.rows
        .map(normalizeTransaction)
        .filter((row): row is NonNullable<typeof row> => row !== null),
      truncated: transactions.truncated || tokenTransfers.truncated || internal.truncated,
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
      const response = await this.fetchWithRetry(url, action, timeoutMs);
      const pageRows = rowsFromBody(await response.json());
      rows.push(...pageRows);
      if (pageRows.length < PAGE_SIZE) return { rows, truncated: false };
      const oldest = oldestTimestamp(pageRows);
      if (oldest !== null && oldest < sinceUnix) return { rows, truncated: false };
      if (page === MAX_PAGES) return { rows, truncated: true };
    }
    return { rows, truncated: true };
  }

  private async fetchWithRetry(url: URL, action: string, timeoutMs: number): Promise<Response> {
    let response: Response | null = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      response = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
        headers: { accept: "application/json" },
      });
      if (response.ok) return response;
      if ((response.status === 429 || response.status >= 500) && attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        continue;
      }
      throw new Error(`Blockscout ${action} returned HTTP ${response.status}.`);
    }
    throw new Error(`Blockscout ${action} returned HTTP ${response?.status ?? 0}.`);
  }
}
