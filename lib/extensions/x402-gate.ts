import type { X402_PRICE_USD } from "@/lib/config";

/**
 * Extension point for the x402 payment gate.
 * Not implemented. A later branch replaces the placeholder in lib/x402.ts.
 * The implementation must not generate a key, store a key, or send a transaction.
 */
export type X402Decision = {
  status: 402;
  body: {
    error: string;
    priceUsd: typeof X402_PRICE_USD;
  };
};

export interface X402Gate {
  decide(input: { requestUrl: string }): X402Decision | null;
}
