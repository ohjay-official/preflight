import { getAddress, type Address, type Hex } from "viem";
import { describe, expect, it } from "vitest";
import type { AccountActivity, ActivitySource } from "@/lib/activity/types";
import type { ChainReader, IdentityOnChain, KeyOnChain } from "@/lib/chain/reader";
import { loadReport, type CheckDeps } from "@/lib/checks/run";
import { keyStatus } from "@/lib/checks/keystore";
import { fundingSentence } from "@/lib/checks/payments";
import { decideVerdict } from "@/lib/checks/verdict";

const NOW = 1_800_000_000;
const agent = getAddress("0x1111111111111111111111111111111111111111");
const payerA = getAddress("0x2222222222222222222222222222222222222222");
const payerB = getAddress("0x3333333333333333333333333333333333333333");
const owner = getAddress("0x4444444444444444444444444444444444444444");

const liveRoot: KeyOnChain = {
  keyId: `0x${"aa".repeat(32)}`,
  valid: true,
  root: true,
  expiry: 0n,
  metadata: "0x",
};

function hash(byte: string): Hex {
  return `0x${byte.repeat(32)}`;
}

function emptyActivity(): AccountActivity {
  return {
    transactions: [],
    tokenTransfers: [],
    internalTransactions: [],
    truncated: false,
    internalRead: true,
  };
}

function chain(partial: Partial<ChainReader> = {}): ChainReader {
  return {
    getIdentityBalance: async () => 1n,
    readIdentities: async () => ({ records: [], truncated: false }),
    readKeys: async () => ({ keys: [liveRoot], truncated: false }),
    ...partial,
  };
}

function activitySource(partial: Partial<ActivitySource> = {}): ActivitySource {
  return {
    label: "fake",
    getAccountActivity: async () => emptyActivity(),
    getIdentityTokenIds: async () => ({ tokenIds: [], truncated: false }),
    ...partial,
  };
}

function deps(partial: Partial<CheckDeps> = {}): CheckDeps {
  return {
    chain: chain(),
    activity: activitySource(),
    now: () => new Date(NOW * 1000),
    hackathonMode: false,
    readName: async () => null,
    ...partial,
  };
}

function paymentActivity(): AccountActivity {
  return {
    ...emptyActivity(),
    tokenTransfers: [
      {
        hash: hash("11"),
        from: payerA,
        to: agent,
        value: 5n * 10n ** 6n,
        timestamp: NOW - 100,
        tokenSymbol: "USDC",
        tokenDecimals: 6,
        tokenContract: getAddress("0x5555555555555555555555555555555555555555"),
        success: true,
      },
      {
        hash: hash("22"),
        from: payerB,
        to: agent,
        value: 2n * 10n ** 6n,
        timestamp: NOW - 50,
        tokenSymbol: "USDC",
        tokenDecimals: 6,
        tokenContract: getAddress("0x5555555555555555555555555555555555555555"),
        success: true,
      },
    ],
  };
}

describe("check verdicts", () => {
  it("says OK to pay when identity, a live key, two payers, and no funding link are all present", async () => {
    const result = await loadReport(agent, deps({ activity: activitySource({ getAccountActivity: async () => paymentActivity() }) }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report.verdict).toBe("OK to pay");
    expect(result.report.reason).toContain("no funding link was found");
    const payments = result.report.checks.find((check) => check.id === "payments");
    expect(payments?.summary).toContain("No funding link found.");
    expect(JSON.stringify(result.report)).not.toMatch(/independent/i);
    expect(JSON.stringify(result.report)).not.toContain("\u2014");
  });

  it("says Don't pay when no identity is registered", async () => {
    const result = await loadReport(
      agent,
      deps({
        chain: chain({
          getIdentityBalance: async () => 0n,
          readKeys: async () => ({ keys: [], truncated: false }),
        }),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report.verdict).toBe("Don't pay");
    const identity = result.report.checks.find((check) => check.id === "identity");
    expect(identity?.status).toBe("Not found");
  });

  it("says Don't pay when the keystore has no keys", async () => {
    const result = await loadReport(
      agent,
      deps({ chain: chain({ readKeys: async () => ({ keys: [], truncated: false }) }) }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report.verdict).toBe("Don't pay");
    const keystore = result.report.checks.find((check) => check.id === "keystore");
    expect(keystore?.status).toBe("Not found");
    if (keystore?.id === "keystore") {
      expect(keystore.note).toContain("does not show spending caps");
    }
  });

  it("marks an expired key and refuses payment", async () => {
    const expired: KeyOnChain = { ...liveRoot, valid: false, root: false, expiry: BigInt(NOW - 10) };
    const result = await loadReport(
      agent,
      deps({ chain: chain({ readKeys: async () => ({ keys: [expired], truncated: false }) }) }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report.verdict).toBe("Don't pay");
    const keystore = result.report.checks.find((check) => check.id === "keystore");
    expect(keystore?.status).toBe("Expired");
  });

  it("marks an invalid unexpired key revoked", async () => {
    const revoked: KeyOnChain = { ...liveRoot, valid: false, root: false, expiry: 0n };
    const result = await loadReport(
      agent,
      deps({ chain: chain({ readKeys: async () => ({ keys: [revoked], truncated: false }) }) }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report.verdict).toBe("Don't pay");
    const keystore = result.report.checks.find((check) => check.id === "keystore");
    expect(keystore?.status).toBe("Revoked");
  });

  it("drops to small amounts when a payer was funded by the agent", async () => {
    const linked = paymentActivity();
    linked.transactions = [
      {
        hash: hash("33"),
        from: agent,
        to: payerA,
        value: 10n ** 18n,
        timestamp: NOW - 80,
        input: "0x",
        success: true,
      },
    ];
    const result = await loadReport(agent, deps({ activity: activitySource({ getAccountActivity: async () => linked }) }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report.verdict).toBe("Small amounts only");
    const payments = result.report.checks.find((check) => check.id === "payments");
    expect(payments?.summary).toContain("Funding link found.");
    expect(payments?.summary.toLowerCase()).not.toContain("independent");
  });

  it("does not say OK to pay when the ERC-20 list failed", async () => {
    const partial = paymentActivity();
    partial.tokenRead = false;
    partial.tokenError = "Blockscout tokentx returned HTTP 500.";
    partial.tokenTransfers = [];
    const result = await loadReport(
      agent,
      deps({ activity: activitySource({ getAccountActivity: async () => partial }) }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report.verdict).toBe("Small amounts only");
    const payments = result.report.checks.find((check) => check.id === "payments");
    expect(payments?.summary).toContain("ERC-20 transfers could not be read");
    expect(payments?.summary).toContain("HTTP 500");
  });

  it("drops to small amounts when payment history cannot be read", async () => {
    const result = await loadReport(
      agent,
      deps({
        activity: activitySource({
          getAccountActivity: async () => {
            throw new Error("blockscout down");
          },
        }),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report.verdict).toBe("Small amounts only");
    const payments = result.report.checks.find((check) => check.id === "payments");
    expect(payments?.status).toBe("Unread");
  });

  it("does not double count a payment that appears on both the agent and the owner", async () => {
    const shared = paymentActivity().tokenTransfers[0];
    if (!shared) throw new Error("fixture missing");
    const calls: Address[] = [];
    const record: IdentityOnChain = {
      tokenId: 4n,
      owner,
      agentWallet: agent,
      tokenUri: null,
    };
    const result = await loadReport(
      agent,
      deps({
        chain: chain({
          getIdentityBalance: async () => 0n,
          readIdentities: async () => ({ records: [record], truncated: false }),
        }),
        activity: activitySource({
          getIdentityTokenIds: async () => ({ tokenIds: [4n], truncated: false }),
          getAccountActivity: async (address) => {
            calls.push(address);
            if (address.toLowerCase() === owner.toLowerCase()) {
              return {
                ...emptyActivity(),
                tokenTransfers: [shared],
                transactions: [
                  {
                    hash: hash("44"),
                    from: owner,
                    to: payerA,
                    value: 1n,
                    timestamp: NOW - 20,
                    input: "0x",
                    success: true,
                  },
                ],
              };
            }
            return paymentActivity();
          },
        }),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const payments = result.report.checks.find((check) => check.id === "payments");
    expect(payments?.id).toBe("payments");
    if (payments?.id !== "payments") return;
    expect(payments.incomingCount).toBe(2);
    expect(payments.distinctPayers).toBe(2);
    expect(payments.fundingLinks.length).toBe(1);
    expect(payments.fundingLinks[0]?.funderRole).toBe("Owner");
    expect(result.report.verdict).toBe("Small amounts only");
    expect(calls.map((item) => item.toLowerCase())).toContain(owner.toLowerCase());
  });

  it("matches an agent wallet that does not own the identity NFT", async () => {
    const calls: Address[] = [];
    const record: IdentityOnChain = {
      tokenId: 9n,
      owner,
      agentWallet: agent,
      tokenUri: "ipfs://agent",
    };
    const result = await loadReport(
      agent,
      deps({
        chain: chain({
          getIdentityBalance: async () => 0n,
          readIdentities: async () => ({ records: [record], truncated: false }),
        }),
        activity: activitySource({
          getIdentityTokenIds: async () => ({ tokenIds: [9n], truncated: false }),
          getAccountActivity: async (address) => {
            calls.push(address);
            return emptyActivity();
          },
        }),
        readName: async () => "Rates API",
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const identity = result.report.checks.find((check) => check.id === "identity");
    expect(identity?.status).toBe("Live");
    if (identity?.id === "identity") {
      expect(identity.records[0]?.matchedAs).toBe("Agent wallet");
      expect(identity.records[0]?.name).toBe("Rates API");
    }
    expect(calls.map((item) => item.toLowerCase())).toContain(owner.toLowerCase());
    expect(result.report.verdict).toBe("Small amounts only");
  });

  it("rejects a bad address without calling the chain", async () => {
    let called = false;
    const result = await loadReport(
      "not-an-address",
      deps({
        chain: chain({
          getIdentityBalance: async () => {
            called = true;
            return 0n;
          },
        }),
      }),
    );
    expect(result.ok).toBe(false);
    expect(called).toBe(false);
  });
});

describe("fixed rules", () => {
  it("maps keystore validity the way the verified contract does", () => {
    expect(keyStatus({ valid: true, expiry: 0n }, NOW)).toBe("Live");
    expect(keyStatus({ valid: false, expiry: BigInt(NOW - 1) }, NOW)).toBe("Expired");
    expect(keyStatus({ valid: false, expiry: 0n }, NOW)).toBe("Revoked");
  });

  it("does not call a missing funding link independent", () => {
    expect(fundingSentence(false, true)).toBe("No funding link found.");
    expect(fundingSentence(false, true).toLowerCase()).not.toContain("independent");
    expect(fundingSentence(true, true)).toContain("Funding link found.");
  });

  it("keeps a live identity and key in the small-amount band when payers are thin", () => {
    const decision = decideVerdict({
      identityStatus: "Live",
      keystoreStatus: "Live",
      paymentsStatus: "Not found",
      distinctPayers: 0,
      fundingLinkFound: false,
      historyComplete: true,
    });
    expect(decision.verdict).toBe("Small amounts only");
  });
});
