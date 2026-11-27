import { afterEach, describe, expect, it } from "vitest";
import { x402Gate } from "@/lib/x402";

afterEach(() => {
  delete process.env.X402_GATING_ENABLED;
});

describe("x402 stub", () => {
  it("is off by default and collects nothing", () => {
    expect(x402Gate().blocked).toBe(false);
  });

  it("withholds the check when the flag is on, without taking payment", () => {
    process.env.X402_GATING_ENABLED = "true";
    const gate = x402Gate();
    expect(gate.blocked).toBe(true);
    if (!gate.blocked) return;
    expect(gate.body.priceUsd).toBe("0.02");
    expect(gate.body.todo).toContain("TODO");
    expect(gate.body.error).toContain("not implemented");
  });
});
