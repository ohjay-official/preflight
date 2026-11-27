import type { Address } from "viem";

export const CELO_CHAIN_ID = 42220 as const;

/**
 * ERC-8004 Identity Registry on Celo mainnet.
 * Source: https://docs.celo.org/build-on-celo/build-with-ai/8004
 */
export const IDENTITY_REGISTRY: Address =
  "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";

export const IDENTITY_REGISTRY_DOCS =
  "https://docs.celo.org/build-on-celo/build-with-ai/8004";

/**
 * Altana Keystore on Celo mainnet.
 * Verified on Blockscout as KeyStore (not a proxy). ABI in lib/abi/keystore.ts.
 * Celoscan's ABI endpoint required an API key, so the ABI was taken from Blockscout.
 */
export const KEYSTORE: Address = "0x83b30935f36d6ccf9B1ec3b5E47F2866b97cd27c";

export const DEFAULT_CELO_RPC_URL = "https://forno.celo.org";
export const DEFAULT_BLOCKSCOUT_API_URL = "https://celo.blockscout.com/api";

export const PAYMENT_WINDOW_DAYS = 30;
export const X402_PRICE_USD = "0.02" as const;

export const MAX_KEYS = 40;
export const MAX_IDENTITY_IDS = 25;
export const MAX_OWNERS_TO_SCAN = 5;

export function rpcUrl(): string {
  return process.env.CELO_RPC_URL?.trim() || DEFAULT_CELO_RPC_URL;
}

export function blockscoutApiUrl(): string {
  return process.env.BLOCKSCOUT_API_URL?.trim() || DEFAULT_BLOCKSCOUT_API_URL;
}

export function hackathonModeEnabled(): boolean {
  return process.env.HACKATHON_MODE === "true";
}

export function windowStart(nowUnix: number): number {
  return nowUnix - PAYMENT_WINDOW_DAYS * 24 * 60 * 60;
}
