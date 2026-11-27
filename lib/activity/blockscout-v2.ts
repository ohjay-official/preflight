import { getAddress, isAddress, type Address, type Hex } from "viem";
import type { NormalizedTokenTransfer, NormalizedTx } from "@/lib/activity/types";
import { requestWithBackoff } from "@/lib/http";

const MAX_PAGES = 8;

export type V2Lists = {
  transactions: NormalizedTx[];
  tokenTransfers: NormalizedTokenTransfer[];
  internalTransactions: NormalizedTx[];
  truncated: boolean;
};

export async function readBlockscoutV2(
  origin: string,
  address: Address,
  sinceUnix: number,
  retry: { fetchImpl?: typeof fetch; backoffMs?: number[] } = {},
): Promise<V2Lists> {
  const [transactions, tokenTransfers, internalTransactions] = await Promise.all([
    readPages(origin, `/addresses/${address}/transactions`, sinceUnix, normalizeV2Transaction, retry),
    readPages(origin, `/addresses/${address}/token-transfers?type=ERC-20`, sinceUnix, normalizeV2TokenTransfer, retry),
    readPages(origin, `/addresses/${address}/internal-transactions`, sinceUnix, normalizeV2Internal, retry),
  ]);
  return {
    transactions: transactions.rows,
    tokenTransfers: tokenTransfers.rows,
    internalTransactions: internalTransactions.rows,
    truncated: transactions.truncated || tokenTransfers.truncated || internalTransactions.truncated,
  };
}

export function blockscoutV2Origin(apiUrl: string): string {
  const url = new URL(apiUrl);
  return `${url.origin}/api/v2`;
}

export function normalizeV2Transaction(item: unknown): NormalizedTx | null {
  return normalizeMovement(item, "raw_input");
}

export function normalizeV2Internal(item: unknown): NormalizedTx | null {
  return normalizeMovement(item, null);
}

export function normalizeV2TokenTransfer(item: unknown): NormalizedTokenTransfer | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const hash = asHash(row.transaction_hash);
  const from = addressOf(row.from);
  const token = row.token && typeof row.token === "object" ? (row.token as Record<string, unknown>) : {};
  const tokenContract = asAddress(token.address_hash ?? token.address);
  if (!hash || !from || !tokenContract) return null;
  const total = row.total && typeof row.total === "object" ? (row.total as Record<string, unknown>) : {};
  const decimals = numberOf(total.decimals ?? token.decimals) ?? 18;
  return {
    hash,
    from,
    to: addressOf(row.to),
    value: integerOf(total.value),
    timestamp: timestampOf(row.timestamp),
    tokenSymbol: typeof token.symbol === "string" ? token.symbol : "",
    tokenDecimals: decimals,
    tokenContract,
    success: row.error == null,
  };
}

async function readPages<T>(
  origin: string,
  path: string,
  sinceUnix: number,
  mapRow: (item: unknown) => T | null,
  retry: { fetchImpl?: typeof fetch; backoffMs?: number[] },
): Promise<{ rows: T[]; truncated: boolean }> {
  const rows: T[] = [];
  let params = "";
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = `${origin}${path}${path.includes("?") ? "&" : "?"}items_count=100${params}`;
    const response = await requestWithBackoff(url, 8_000, {
      attempts: 2,
      backoffMs: retry.backoffMs ?? [200],
      fetchImpl: retry.fetchImpl,
    });
    const body: unknown = await response.json();
    const record = body && typeof body === "object" ? (body as { items?: unknown; next_page_params?: unknown }) : {};
    const items = Array.isArray(record.items) ? record.items : [];
    let oldest = Number.POSITIVE_INFINITY;
    for (const item of items) {
      const mapped = mapRow(item);
      if (mapped) rows.push(mapped);
      const timestamp = timestampOf(item && typeof item === "object" ? (item as { timestamp?: unknown }).timestamp : undefined);
      if (timestamp > 0) oldest = Math.min(oldest, timestamp);
    }
    if (items.length < 100 || oldest < sinceUnix) return { rows, truncated: false };
    if (!record.next_page_params || typeof record.next_page_params !== "object") return { rows, truncated: false };
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(record.next_page_params)) {
      if (typeof value === "string" || typeof value === "number") search.set(key, String(value));
    }
    params = `&${search.toString()}`;
  }
  return { rows, truncated: true };
}

function normalizeMovement(item: unknown, inputKey: "raw_input" | null): NormalizedTx | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const hash = asHash(row.hash ?? row.transaction_hash);
  const from = addressOf(row.from);
  if (!hash || !from) return null;
  const input = inputKey && typeof row[inputKey] === "string" ? asHex(row[inputKey]) : "0x";
  const success = row.status === "ok" || row.success === true || (row.status == null && row.error == null && row.success !== false);
  return {
    hash,
    from,
    to: addressOf(row.to),
    value: integerOf(row.value),
    timestamp: timestampOf(row.timestamp),
    input,
    success,
  };
}

function addressOf(value: unknown): Address | null {
  if (!value) return null;
  if (typeof value === "string") return asAddress(value);
  if (typeof value === "object" && value && "hash" in value) return asAddress((value as { hash?: unknown }).hash);
  return null;
}

function asAddress(value: unknown): Address | null {
  if (typeof value !== "string" || !isAddress(value, { strict: false })) return null;
  return getAddress(value);
}

function asHash(value: unknown): Hex | null {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(value)) return null;
  return value as Hex;
}

function asHex(value: string): Hex {
  const prefixed = value.startsWith("0x") ? value : `0x${value}`;
  return /^0x[0-9a-fA-F]*$/.test(prefixed) && prefixed.length % 2 === 0 ? (prefixed as Hex) : "0x";
}

function integerOf(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isInteger(value)) return BigInt(value);
  if (typeof value === "string" && /^\d+$/.test(value)) return BigInt(value);
  return 0n;
}

function numberOf(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

function timestampOf(value: unknown): number {
  if (typeof value !== "string") return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : Math.floor(parsed / 1000);
}
