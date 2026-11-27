import { getAddress, isAddress, type Address, type Hex } from "viem";
import type { NormalizedTokenTransfer, NormalizedTx } from "@/lib/activity/types";

export function rowsFromBody(body: unknown): Record<string, string>[] {
  if (!body || typeof body !== "object") {
    throw new Error("Blockscout returned a body that was not an object.");
  }
  const record = body as { status?: string; message?: string; result?: unknown };
  if (Array.isArray(record.result)) {
    return record.result
      .map(asRow)
      .filter((row): row is Record<string, string> => row !== null);
  }
  const message = typeof record.message === "string" ? record.message : "";
  const result = typeof record.result === "string" ? record.result : "";
  if (/no transactions found/i.test(message) || /no transactions found/i.test(result)) {
    return [];
  }
  throw new Error((result || message || "Blockscout request failed.").slice(0, 300));
}

export function normalizeTransaction(row: Record<string, string>): NormalizedTx | null {
  const hash = asHash(row.hash);
  const from = asAddress(row.from);
  if (!hash || !from) return null;
  const input = asHexData(row.input) ?? "0x";
  return {
    hash,
    from,
    to: asAddress(row.to),
    value: parseInteger(row.value),
    timestamp: parseTimestamp(row.timeStamp),
    input,
    success: isSuccess(row),
  };
}

export function normalizeTokenTransfer(row: Record<string, string>): NormalizedTokenTransfer | null {
  const hash = asHash(row.hash);
  const from = asAddress(row.from);
  const tokenContract = asAddress(row.contractAddress);
  if (!hash || !from || !tokenContract) return null;
  const decimals = Number(row.tokenDecimal);
  return {
    hash,
    from,
    to: asAddress(row.to),
    value: parseInteger(row.value),
    timestamp: parseTimestamp(row.timeStamp),
    tokenSymbol: (row.tokenSymbol || "").trim(),
    tokenDecimals: Number.isInteger(decimals) && decimals >= 0 && decimals <= 36 ? decimals : 18,
    tokenContract,
    success: isSuccess(row),
  };
}

export function tokenIdFromRow(row: Record<string, string>): bigint | null {
  const raw = row.tokenID || row.tokenId;
  if (!raw || !/^\d+$/.test(raw)) return null;
  return BigInt(raw);
}

export function oldestTimestamp(rows: Record<string, string>[]): number | null {
  let oldest: number | null = null;
  for (const row of rows) {
    const timestamp = parseTimestamp(row.timeStamp);
    if (timestamp === 0) continue;
    if (oldest === null || timestamp < oldest) oldest = timestamp;
  }
  return oldest;
}

function asRow(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object") return null;
  const out: Record<string, string> = {};
  for (const [key, field] of Object.entries(value)) {
    if (typeof field === "string" || typeof field === "number") out[key] = String(field);
  }
  return out;
}

function asAddress(value: string | undefined): Address | null {
  if (!value || !isAddress(value, { strict: false })) return null;
  return getAddress(value);
}

function asHash(value: string | undefined): Hex | null {
  return asFixedHex(value, 32);
}

function asHexData(value: string | undefined): Hex | null {
  if (!value) return null;
  const prefixed = value.startsWith("0x") ? value : `0x${value}`;
  if (!/^0x[0-9a-fA-F]*$/.test(prefixed) || prefixed.length % 2 !== 0) return null;
  return prefixed as Hex;
}

function asFixedHex(value: string | undefined, bytes: number): Hex | null {
  const hex = asHexData(value);
  if (!hex) return null;
  if ((hex.length - 2) / 2 !== bytes) return null;
  return hex;
}

function parseInteger(value: string | undefined): bigint {
  if (!value || !/^\d+$/.test(value)) return 0n;
  return BigInt(value);
}

function parseTimestamp(value: string | undefined): number {
  if (!value || !/^\d+$/.test(value)) return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return parsed > 10_000_000_000 ? Math.floor(parsed / 1000) : parsed;
}

function isSuccess(row: Record<string, string>): boolean {
  if (row.isError === "1") return false;
  if (row.txreceipt_status === "0") return false;
  return true;
}
