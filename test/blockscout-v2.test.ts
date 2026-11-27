import { describe, expect, it } from "vitest";
import { normalizeV2TokenTransfer, normalizeV2Transaction } from "@/lib/activity/blockscout-v2";

describe("Blockscout v2 rows", () => {
  it("reads an incoming ERC-20 transfer", () => {
    const row = normalizeV2TokenTransfer({
      from: { hash: "0x2222222222222222222222222222222222222222" },
      to: { hash: "0x1111111111111111111111111111111111111111" },
      transaction_hash: `0x${"ab".repeat(32)}`,
      timestamp: "2026-11-26T23:59:39.000000Z",
      token: { symbol: "CELO", decimals: "18", address_hash: "0x3333333333333333333333333333333333333333" },
      total: { value: "200000000000000000", decimals: "18" },
    });
    expect(row?.tokenSymbol).toBe("CELO");
    expect(row?.value).toBe(200000000000000000n);
    expect(row?.timestamp).toBe(Math.floor(Date.parse("2026-11-26T23:59:39.000000Z") / 1000));
  });

  it("reads a native transaction", () => {
    const row = normalizeV2Transaction({
      hash: `0x${"cd".repeat(32)}`,
      from: { hash: "0x1111111111111111111111111111111111111111" },
      to: { hash: "0x2222222222222222222222222222222222222222" },
      value: "0",
      timestamp: "2026-11-27T00:01:14.000000Z",
      status: "ok",
      raw_input: "0x1234",
    });
    expect(row?.success).toBe(true);
    expect(row?.input).toBe("0x1234");
    expect(row?.value).toBe(0n);
  });
});
