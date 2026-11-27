import type { ActivitySource } from "@/lib/activity/types";

/**
 * Extension point for a paid activity source, such as a Chainstack archive
 * read paid over x402. Not implemented.
 * The implementation must stay read-only: no keys and no transactions from this app.
 */
export interface PaidActivitySource extends ActivitySource {
  readonly kind: "paid";
}

export function createPaidActivitySource(): PaidActivitySource {
  const notImplemented = async (): Promise<never> => {
    throw new Error("Paid activity source is not implemented. See docs/ARCHITECTURE.md.");
  };
  return {
    kind: "paid",
    label: "Paid activity source",
    getAccountActivity: notImplemented,
    getIdentityTokenIds: notImplemented,
  };
}
