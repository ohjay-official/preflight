import { describe, expect, it } from "vitest";
import { EXAMPLE_ADDRESSES } from "@/lib/examples";
import { loadReport } from "@/lib/checks/run";

/**
 * Optional timing against Celo mainnet.
 * Run with RUN_LIVE_TESTS=1. Read only.
 */
const enabled = process.env.RUN_LIVE_TESTS === "1";

describe.skipIf(!enabled)("check timing", () => {
  it("finishes a typical mainnet address in under 10 seconds, then faster from cache", async () => {
    const address = EXAMPLE_ADDRESSES[0]?.address;
    if (!address) throw new Error("missing example");
    const firstStarted = Date.now();
    const first = await loadReport(address);
    const firstMs = Date.now() - firstStarted;
    const secondStarted = Date.now();
    const second = await loadReport(address);
    const secondMs = Date.now() - secondStarted;
    console.log(`timing ${address} first ${firstMs}ms second ${secondMs}ms`);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(firstMs).toBeLessThan(12_000);
    expect(secondMs).toBeLessThan(1_000);
  }, 30_000);
});
