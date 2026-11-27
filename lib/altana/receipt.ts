import { encodeFunctionData, getAddress, keccak256, parseAbi, toHex, type Address, type Hex } from "viem";
import type { Report, Verdict } from "@/lib/types";

/**
 * The onchain receipt Preflight's agent writes, from its Altana wallet, when an agent pays to
 * check ITSELF. It lands on the checked agent's ERC-8004 record, where explorers already look.
 * Never written for an agent that didn't ask.
 */
export const reputationAbi = parseAbi([
  "function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)",
]);

export const RECEIPT_TAG = "preflight";

const VALUE: Record<Verdict, bigint> = { "OK to pay": 100n, "Small amounts only": 50n, "Don't pay": 0n };
const SLUG: Record<Verdict, string> = { "OK to pay": "ok-to-pay", "Small amounts only": "small-amounts-only", "Don't pay": "dont-pay" };

export function verdictValue(verdict: Verdict): bigint {
  return VALUE[verdict];
}

export function verdictSlug(verdict: Verdict): string {
  return SLUG[verdict];
}

/** A stable hash of the report the receipt points to. */
export function hashReport(report: Report): Hex {
  return keccak256(toHex(JSON.stringify(report)));
}

/**
 * Is the payer checking itself? True when the payer is the checked address, or an owner or agent
 * wallet on one of its ERC-8004 records. Returns that record's agent id, or null.
 */
export function selfCheckAgentId(report: Report, payer: Address): bigint | null {
  const p = getAddress(payer);
  const identity = report.checks.find((c) => c.id === "identity");
  const records = identity && identity.id === "identity" ? identity.records : [];
  const own = getAddress(report.address) === p;
  const match = records.find((r) => own || getAddress(r.owner) === p || getAddress(r.agentWallet) === p);
  if (!match) return null;
  try {
    return BigInt(match.tokenId);
  } catch {
    return null;
  }
}

export function encodeReceipt(input: { agentId: bigint; verdict: Verdict; reportUrl: string; reportHash: Hex }): Hex {
  return encodeFunctionData({
    abi: reputationAbi,
    functionName: "giveFeedback",
    args: [input.agentId, verdictValue(input.verdict), 0, RECEIPT_TAG, verdictSlug(input.verdict), "", input.reportUrl, input.reportHash],
  });
}
