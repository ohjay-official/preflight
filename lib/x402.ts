import { X402_PRICE_USD } from "@/lib/config";

export type X402Blocked = {
  blocked: true;
  body: {
    error: string;
    priceUsd: typeof X402_PRICE_USD;
    todo: string;
  };
};

/**
 * x402 payment gate. Off unless X402_GATING_ENABLED=true.
 * TODO: accept a $0.02 x402 payment per check, then return the report.
 * The stub collects nothing and stores no key. When the flag is on, the
 * check is withheld with HTTP 402 because there is no facilitator yet.
 */
export function x402Gate(): { blocked: false } | X402Blocked {
  if (process.env.X402_GATING_ENABLED !== "true") {
    return { blocked: false };
  }
  return {
    blocked: true,
    body: {
      error:
        "Payment required. x402 collection is not implemented, so this check cannot be completed while the flag is on.",
      priceUsd: X402_PRICE_USD,
      todo: "TODO: accept a $0.02 x402 payment per check, then return the report. Do not add a private key here.",
    },
  };
}

export function x402ReportNote(): {
  enabled: false;
  priceUsd: typeof X402_PRICE_USD;
  note: string;
} {
  return {
    enabled: false,
    priceUsd: X402_PRICE_USD,
    note: "Gating is off. No payment is collected.",
  };
}
