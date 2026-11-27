import { describe, expect, it } from "vitest";
import { requestWithBackoff } from "@/lib/http";

describe("requestWithBackoff", () => {
  it("retries a 500 and then returns the next success", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      if (calls === 1) return new Response("busy", { status: 500 });
      return new Response("ok", { status: 200 });
    };
    const response = await requestWithBackoff("https://example.test/logs", 1000, {
      fetchImpl,
      backoffMs: [0, 0],
    });
    expect(response.status).toBe(200);
    expect(calls).toBe(2);
  });

  it("does not retry a timeout", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      const error = new Error("timed out");
      error.name = "TimeoutError";
      throw error;
    };
    await expect(
      requestWithBackoff("https://example.test/logs", 1000, { fetchImpl, backoffMs: [0, 0] }),
    ).rejects.toThrow(/timed out/);
    expect(calls).toBe(1);
  });
});
