import type { Address } from "viem";

/**
 * Contracts Preflight's own agent uses on Celo mainnet.
 * Every address here was read on mainnet on 27 Nov 2026; see docs/test-results.md.
 */
export const KEYSTORE_CONTROLLER: Address = "0x47bA5fc2A5b0CcB24BA3fAC9D4B59400eE9fd1D6";

/** ERC-8004 Reputation Registry (proxy to ReputationRegistryUpgradeable). */
export const REPUTATION_REGISTRY: Address = "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63";

export const USDC: Address = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
export const USDT: Address = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";

/** The one function the agent's session may call: write a receipt to a checked agent's ERC-8004 record. */
export const RECEIPT_SIGNATURE = "giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)";

/** $0.25 a day in USDC (6 decimals). It only pays Altana's relay fee on receipts, about $0.005 each. */
export const SESSION_DAILY_CAP_USDC = 250_000n;

/** 14 Dec 2026, 23:00 UTC: after the 11 Dec winners announcement. */
export const SESSION_EXPIRY_UNIX = Math.floor(Date.UTC(2026, 11, 14, 23, 0, 0) / 1000);

/**
 * What the admin grants. Calls are locked to one function on one contract (`to` + `signature`,
 * AND semantics), so the session can't move tokens or touch the identity registry.
 * The spend cap also bounds the relay fees Altana takes in USDC.
 */
export function sessionPermissions() {
  return {
    calls: [{ to: REPUTATION_REGISTRY, signature: RECEIPT_SIGNATURE }],
    spend: [{ token: USDC, limit: SESSION_DAILY_CAP_USDC, period: "day" as const }],
  };
}

/** The ERC-8004 record Preflight's wallet registers for itself. */
export function agentIdentityRecord(siteUrl: string) {
  return {
    name: "Preflight",
    description:
      "Checks any Celo agent before you pay it or plug it in: its ERC-8004 identity, whether its Altana spending key is live, capped and revocable, and who has really paid it. $0.02 a check over x402.",
    ...(siteUrl ? { endpoint: siteUrl } : {}),
  };
}

/**
 * The passkey is bound to this host. It must be the production address, set before the admin
 * passkey is created, because a passkey made on one host can't sign on another.
 */
export function passkeyRpId(): string | null {
  return process.env.NEXT_PUBLIC_PASSKEY_RP_ID?.trim() || null;
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || "";
}

/** Altana account key types (SDK internal/account.ts). */
export const KEY_TYPES = ["P256", "Passkey", "secp256k1", "External"] as const;

/** Spend periods as the account stores them (SDK SpendPermission order). */
export const PERIODS = ["minute", "hour", "day", "week", "month", "year"] as const;
