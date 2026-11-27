import { formatUnits } from "viem";

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message.replace(/[\u2014\u2013]/g, "-").slice(0, 300);
  }
  return "The read failed.";
}

export function formatAmount(value: bigint, decimals: number): string {
  const raw = formatUnits(value, decimals);
  if (!raw.includes(".")) return raw;
  const trimmed = raw.replace(/0+$/, "").replace(/\.$/, "");
  return trimmed === "" ? "0" : trimmed;
}

export function sameAddress(left: string | null | undefined, right: string | null | undefined): boolean {
  if (!left || !right) return false;
  return left.toLowerCase() === right.toLowerCase();
}

export function expiryLabel(expiry: bigint): string {
  if (expiry === 0n) return "No expiry";
  const date = new Date(Number(expiry) * 1000);
  if (Number.isNaN(date.getTime())) return "Unreadable expiry";
  return date.toISOString().replace(".000Z", " UTC");
}

export function cleanName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value
    .replace(/[\u0000-\u001F]/g, " ")
    .replace(/[\u2014\u2013]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  return cleaned.slice(0, 80);
}

export function shortList<T>(items: T[], limit: number): { shown: T[]; extra: number } {
  if (items.length <= limit) return { shown: items, extra: 0 };
  return { shown: items.slice(0, limit), extra: items.length - limit };
}
