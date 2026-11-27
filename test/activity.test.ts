import { getAddress } from "viem";
import { describe, expect, it } from "vitest";
import { normalizeTransaction, rowsFromBody } from "@/lib/activity/parse";
import { createActivitySource } from "@/lib/activity/source";

describe("Blockscout parsing", () => {
  it("treats an empty explorer response as no rows", () => {
    expect(rowsFromBody({ status: "0", message: "No transactions found", result: null })).toEqual([]);
  });

  it("throws on an explorer error string", () => {
    expect(() => rowsFromBody({ status: "0", message: "NOTOK", result: "rate limit" })).toThrow(/rate limit/);
  });

  it("normalizes a successful native transfer", () => {
    const row = normalizeTransaction({
      hash: `0x${"ab".repeat(32)}`,
      from: "0x1111111111111111111111111111111111111111",
      to: "0x2222222222222222222222222222222222222222",
      value: "1000",
      timeStamp: "1800000000",
      input: "0x",
      isError: "0",
      txreceipt_status: "1",
    });
    expect(row?.from).toBe(getAddress("0x1111111111111111111111111111111111111111"));
    expect(row?.value).toBe(1000n);
    expect(row?.success).toBe(true);
    expect(row?.input).toBe("0x");
  });

  it("drops a failed transaction from the success flag", () => {
    const row = normalizeTransaction({
      hash: `0x${"ab".repeat(32)}`,
      from: "0x1111111111111111111111111111111111111111",
      to: "0x2222222222222222222222222222222222222222",
      value: "1000",
      timeStamp: "1800000000",
      input: "0x",
      isError: "1",
    });
    expect(row?.success).toBe(false);
  });
});

describe("activity source selection", () => {
  it("leaves the paid archive source unwired", async () => {
    const source = createActivitySource("chainstack");
    expect(source.label).toBe("Paid activity source");
    await expect(
      source.getAccountActivity(getAddress("0x1111111111111111111111111111111111111111"), 0),
    ).rejects.toThrow(/Paid activity source is not implemented/);
  });
});
