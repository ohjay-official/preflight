import type { CheckStatus, Verdict } from "@/lib/types";

export type VerdictInput = {
  identityStatus: CheckStatus;
  keystoreStatus: CheckStatus;
  paymentsStatus: CheckStatus;
  distinctPayers: number;
  fundingLinkFound: boolean;
  historyComplete: boolean;
};

export function decideVerdict(input: VerdictInput): { verdict: Verdict; reason: string } {
  if (input.identityStatus === "Unread") {
    return {
      verdict: "Don't pay",
      reason: "The identity check could not be read, so this report cannot confirm who the agent is.",
    };
  }
  if (input.identityStatus === "Not found") {
    return {
      verdict: "Don't pay",
      reason: "No ERC-8004 identity was found for this address on Celo mainnet.",
    };
  }
  if (input.identityStatus !== "Live") {
    return {
      verdict: "Don't pay",
      reason: "The identity check did not come back live.",
    };
  }
  if (input.keystoreStatus === "Unread") {
    return {
      verdict: "Don't pay",
      reason: "The keystore check could not be read, so this report cannot confirm the address can be stopped.",
    };
  }
  if (input.keystoreStatus === "Not found") {
    return {
      verdict: "Don't pay",
      reason: "No Altana Keystore keys were found, so this address cannot be stopped from the keystore.",
    };
  }
  if (input.keystoreStatus === "Expired") {
    return {
      verdict: "Don't pay",
      reason: "Keystore keys are expired, so none are live.",
    };
  }
  if (input.keystoreStatus === "Revoked") {
    return {
      verdict: "Don't pay",
      reason: "Keystore keys are revoked, so none are live.",
    };
  }
  if (input.keystoreStatus !== "Live") {
    return {
      verdict: "Don't pay",
      reason: "The keystore check did not come back live.",
    };
  }

  const cautions: string[] = [];
  if (input.paymentsStatus === "Unread") {
    cautions.push("payment history could not be read");
  } else {
    if (!input.historyComplete) cautions.push("payment history is incomplete");
    if (input.fundingLinkFound) cautions.push("a funding link was found");
    if (input.distinctPayers < 2) {
      cautions.push("fewer than two distinct payers paid in the last 30 days");
    }
  }

  if (cautions.length > 0) {
    return {
      verdict: "Small amounts only",
      reason: `Identity is registered and a key is live, but ${joinList(cautions)}.`,
    };
  }

  return {
    verdict: "OK to pay",
    reason:
      "Identity is registered, a key is live, at least two distinct payers paid in the last 30 days, and no funding link was found.",
  };
}

function joinList(items: string[]): string {
  if (items.length === 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
