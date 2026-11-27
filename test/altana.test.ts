import { decodeFunctionData, getAddress, toFunctionSelector, type Hex } from "viem";
import { describe, expect, it } from "vitest";
import {
  accountKeyHashForAddress,
  addressFromPublicKey,
  decodeAllowlist,
  keyStoreKeyId,
  periodName,
} from "@/lib/altana/account";
import { RECEIPT_SIGNATURE, REPUTATION_REGISTRY, SESSION_DAILY_CAP_USDC, USDC, sessionPermissions } from "@/lib/altana/config";
import { encodeReceipt, reputationAbi, selfCheckAgentId, verdictSlug, verdictValue } from "@/lib/altana/receipt";
import type { Report } from "@/lib/types";

// Real mainnet values read on 27 Nov 2026 from Altana wallet 0xa8dcf6a0304D27cb306830b9503F8cFcf38EFf7D
// (docs/test-results.md, test 1; raw data on the altana-test-results branch, t1-keys.json).
const SESSION_PUBLIC_KEY: Hex =
  "0x047b793da319b0563d0143505e31f6a70ba43b17d04f8af48caa89e90893c78735db0c146bd473d775fd79c1884d5a4d143f066ab7941f21ed09adc12abff9423e";
const SESSION_KEYSTORE_ID: Hex = "0xd2504335b40da51a497016a7ae4fcf9faca18ddb940cde0271d14badf51fa33f";
const SESSION_ADDRESS = getAddress("0x0ef066d13f3d7cbf885623f4ee5c37b99e5b9ea7");
const SESSION_ACCOUNT_KEY_HASH: Hex = "0x5b29d28e61f7ec83cfc396d2e38d37ccfa221a3483dee4c761b99df7db41ac77";

describe("Altana key helpers, against mainnet values", () => {
  it("derives the KeyStore keyId from the public key", () => {
    expect(keyStoreKeyId(SESSION_PUBLIC_KEY)).toBe(SESSION_KEYSTORE_ID);
  });

  it("derives the session address the account stores", () => {
    expect(addressFromPublicKey(SESSION_PUBLIC_KEY)).toBe(SESSION_ADDRESS);
  });

  it("derives the account's key hash for a secp256k1 session", () => {
    expect(accountKeyHashForAddress(SESSION_ADDRESS)).toBe(SESSION_ACCOUNT_KEY_HASH);
  });

  it("decodes allowlist entries, including any-function", () => {
    const usdcTransfer = `0x${"0".repeat(24)}${USDC.slice(2).toLowerCase()}${"0".repeat(8)}a9059cbb` as Hex;
    const anyFn = `0x${"0".repeat(24)}af140d0416a994aebb3fa6212b16ce6700f09751${"0".repeat(8)}32323232` as Hex;
    const [a, b] = decodeAllowlist([usdcTransfer, anyFn]);
    expect(a).toEqual({ target: USDC, selector: "0xa9059cbb", anyFunction: false });
    expect(b?.anyFunction).toBe(true);
  });

  it("names spend periods as the account stores them", () => {
    expect(periodName(2)).toBe("day");
    expect(periodName(3)).toBe("week");
  });
});

describe("session policy", () => {
  it("allows one function on one contract, with a daily USDC cap", () => {
    const p = sessionPermissions();
    expect(p.calls).toEqual([{ to: REPUTATION_REGISTRY, signature: RECEIPT_SIGNATURE }]);
    expect(p.spend).toEqual([{ token: USDC, limit: SESSION_DAILY_CAP_USDC, period: "day" }]);
  });
});

function report(partial: Partial<Report> = {}): Report {
  return {
    address: getAddress("0x1111111111111111111111111111111111111111"),
    chainId: 42220,
    verdict: "OK to pay",
    reason: "",
    checks: [
      {
        id: "identity",
        title: "Who is it",
        status: "Live",
        summary: "",
        balance: "1",
        records: [
          {
            tokenId: "10134",
            owner: getAddress("0x4444444444444444444444444444444444444444"),
            agentWallet: getAddress("0x1111111111111111111111111111111111111111"),
            tokenUri: null,
            name: "x",
            matchedAs: "Agent wallet",
          },
        ],
      },
    ],
    hackathonMode: false,
    x402: { enabled: false, priceUsd: "0.02", note: "" },
    sources: { identityRegistry: REPUTATION_REGISTRY, identityRegistryDocs: "", keystore: REPUTATION_REGISTRY, activity: "" },
    generatedAt: "2026-11-27T00:00:00.000Z",
    ...partial,
  };
}

describe("receipt", () => {
  it("is written only when the payer checks itself", () => {
    const r = report();
    expect(selfCheckAgentId(r, getAddress("0x1111111111111111111111111111111111111111"))).toBe(10134n);
    expect(selfCheckAgentId(r, getAddress("0x4444444444444444444444444444444444444444"))).toBe(10134n);
    expect(selfCheckAgentId(r, getAddress("0x9999999999999999999999999999999999999999"))).toBeNull();
  });

  it("encodes giveFeedback with the verdict as value and tag", () => {
    const data = encodeReceipt({ agentId: 10134n, verdict: "Small amounts only", reportUrl: "https://x/report/0x1", reportHash: `0x${"ab".repeat(32)}` });
    expect(data.slice(0, 10)).toBe(toFunctionSelector(RECEIPT_SIGNATURE));
    const decoded = decodeFunctionData({ abi: reputationAbi, data });
    expect(decoded.args[0]).toBe(10134n);
    expect(decoded.args[1]).toBe(50n);
    expect(decoded.args[3]).toBe("preflight");
    expect(decoded.args[4]).toBe("small-amounts-only");
    expect(verdictValue("Don't pay")).toBe(0n);
    expect(verdictSlug("OK to pay")).toBe("ok-to-pay");
  });
});
