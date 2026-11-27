import { fromDataSuffix, toDataSuffix, toRoleDataSuffix } from "@celo/attribution-tags";
import { concat, type Hex } from "viem";
import { afterEach, describe, expect, it } from "vitest";
import { appendAttribution } from "@/lib/attribution";
import { decodeTag, interpretAttribution } from "@/lib/checks/attribution";
import type { NormalizedTx } from "@/lib/activity/types";
import { getAddress } from "viem";

const agent = getAddress("0x1111111111111111111111111111111111111111");
const NOW = 1_800_000_000;

afterEach(() => {
  delete process.env.ATTRIBUTION_CODE;
});

describe("appendAttribution", () => {
  it("appends the code so a decoder can read it back", () => {
    const tagged = appendAttribution("0x12345678", "celo_test1234");
    expect(fromDataSuffix(tagged)).toEqual({ codes: ["celo_test1234"], schemaId: 0 });
    expect(tagged.endsWith(toDataSuffix("celo_test1234").slice(2))).toBe(true);
  });

  it("tags empty calldata used by a plain value transfer", () => {
    const tagged = appendAttribution("0x", "celo_test1234");
    expect(fromDataSuffix(tagged)?.codes).toEqual(["celo_test1234"]);
  });

  it("reads ATTRIBUTION_CODE from the environment", () => {
    process.env.ATTRIBUTION_CODE = "celo_test1234";
    expect(fromDataSuffix(appendAttribution("0xaabb"))?.codes).toEqual(["celo_test1234"]);
  });

  it("refuses to build calldata when no code is set", () => {
    expect(() => appendAttribution("0x")).toThrow(/ATTRIBUTION_CODE/);
  });

  it("merges a second code instead of stacking two suffixes", () => {
    const once = appendAttribution("0x1234", "celo_test1234");
    expect(appendAttribution(once, "celo_test1234")).toBe(once);
    const merged = appendAttribution(once, "celo_abc123");
    expect(fromDataSuffix(merged)?.codes).toEqual(["celo_test1234", "celo_abc123"]);
    expect(merged.startsWith("0x1234")).toBe(true);
  });

  it("leaves a schema 2 suffix untouched", () => {
    const role = toRoleDataSuffix({ app: "celo_test1234", wallet: "celo_wallet1" });
    const calldata = concat(["0xabcdef", role]);
    expect(appendAttribution(calldata, "celo_other01")).toBe(calldata);
  });
});

describe("decodeTag", () => {
  it("counts only transactions sent by the agent", () => {
    const tagged = concat(["0x12345678" as Hex, toDataSuffix("celo_test1234")]);
    const base = {
      to: agent,
      value: 0n,
      timestamp: NOW - 10,
      success: true,
    };
    const outgoing: NormalizedTx = {
      ...base,
      hash: `0x${"11".repeat(32)}`,
      from: agent,
      input: tagged,
    };
    const plain: NormalizedTx = {
      ...base,
      hash: `0x${"22".repeat(32)}`,
      from: agent,
      input: "0x",
    };
    const incoming: NormalizedTx = {
      ...base,
      hash: `0x${"33".repeat(32)}`,
      from: getAddress("0x2222222222222222222222222222222222222222"),
      input: tagged,
    };
    const report = interpretAttribution({
      address: agent,
      transactions: [outgoing, plain, incoming],
      nowUnix: NOW,
      readFailed: false,
    });
    expect(decodeTag(tagged)?.codes).toEqual(["celo_test1234"]);
    expect(report.tagged).toBe(1);
    expect(report.total).toBe(2);
    expect(report.status).toBe("Live");
    expect(report.summary).toContain("1 of 2");
  });
});
