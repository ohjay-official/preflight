import { getAddress, type Hex } from "viem";
import { describe, expect, it } from "vitest";
import { BlockscoutActivitySource } from "@/lib/activity/blockscout";

const agent = getAddress("0x1111111111111111111111111111111111111111");
const payer = getAddress("0x2222222222222222222222222222222222222222");
const token = getAddress("0x3333333333333333333333333333333333333333");

describe("ERC-20 fallback", () => {
  it("uses RPC transfer logs when tokentx returns 500", async () => {
    const source = new BlockscoutActivitySource("https://example.test/api", {
      backoffMs: [0, 0],
      fetchImpl: async (input) => {
        const url = String(input);
        if (url.includes("tokentx") || url.includes("/api/v2/")) return new Response("no", { status: 500 });
        return new Response(JSON.stringify({ status: "0", message: "No transactions found", result: null }), {
          status: 200,
        });
      },
      tokenLogs: {
        async read() {
          return {
            complete: true,
            transfers: [
              {
                hash: `0x${"ab".repeat(32)}` as Hex,
                from: payer,
                to: agent,
                value: 5n,
                timestamp: 1_800_000_000,
                tokenSymbol: "USDC",
                tokenDecimals: 6,
                tokenContract: token,
                success: true,
              },
            ],
          };
        },
      },
    });
    const activity = await source.getAccountActivity(agent, 1_700_000_000);
    expect(activity.tokenRead).toBe(true);
    expect(activity.tokenTransfers).toHaveLength(1);
    expect(activity.tokenTransfers[0]?.from).toBe(payer);
  });

  it("stays unread when native history and the token fallback both fail", async () => {
    const source = new BlockscoutActivitySource("https://example.test/api", {
      backoffMs: [0, 0],
      fetchImpl: async () => new Response("no", { status: 500 }),
      tokenLogs: {
        async read() {
          throw new Error("rpc down");
        },
      },
    });
    await expect(source.getAccountActivity(agent, 1_700_000_000)).rejects.toThrow(/HTTP 500/);
  });
});
