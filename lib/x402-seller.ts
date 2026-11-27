import { getAddress, isAddress, type Address } from "viem";
import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import type { PaymentPayload, PaymentRequirements, SettleResponse } from "@x402/core/types";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { USDC, USDT } from "@/lib/altana/config";

/**
 * Seller side of x402 for the paid check, on Celo's hosted facilitator.
 * Follows celo-org/x402-celo-example (read 27 Nov 2026): explicit price with the token's
 * EIP-712 domain, X-API-Key on facilitator calls, x402 v2 headers.
 * Order in the route: verify, run the check, settle only if the check completed.
 */
export const CELO_NETWORK = "eip155:42220" as const;
export const FACILITATOR_URL = "https://api.x402.celo.org";
/** $0.02 in a 6-decimal stablecoin. */
export const PRICE_ATOMIC = "20000";

export type SellerConfig = { ok: true; payTo: Address; apiKey: string } | { ok: false; missing: string[] };

/** PAYTO_ADDRESS is the agent's Altana wallet. X402_API_KEY comes from x402.celo.org. */
export function sellerConfig(): SellerConfig {
  const payTo = process.env.PAYTO_ADDRESS?.trim() ?? "";
  const apiKey = process.env.X402_API_KEY?.trim() ?? "";
  const missing: string[] = [];
  if (!isAddress(payTo, { strict: false })) missing.push("PAYTO_ADDRESS");
  if (!apiKey) missing.push("X402_API_KEY");
  return missing.length ? { ok: false, missing } : { ok: true, payTo: getAddress(payTo), apiKey };
}

let server: Promise<x402ResourceServer> | null = null;

function resourceServer(apiKey: string): Promise<x402ResourceServer> {
  if (!server) {
    server = (async () => {
      const facilitator = new HTTPFacilitatorClient({
        url: FACILITATOR_URL,
        createAuthHeaders: async () => {
          const h = { "X-API-Key": apiKey };
          return { verify: h, settle: h, supported: h };
        },
      });
      const s = new x402ResourceServer(facilitator);
      s.register("eip155:*", new ExactEvmScheme());
      await s.initialize();
      return s;
    })().catch((error) => {
      server = null;
      throw error;
    });
  }
  return server;
}

/** USDC or USD₮, either one. Names are the tokens' EIP-712 domains, not their symbols. */
export function paymentOptions(payTo: Address) {
  return [
    { scheme: "exact", network: CELO_NETWORK, payTo, price: { amount: PRICE_ATOMIC, asset: USDC, extra: { name: "USDC", version: "2" } } },
    { scheme: "exact", network: CELO_NETWORK, payTo, price: { amount: PRICE_ATOMIC, asset: USDT, extra: { name: "Tether USD", version: "1" } } },
  ] as const;
}

export async function buildRequirements(cfg: Extract<SellerConfig, { ok: true }>): Promise<PaymentRequirements[]> {
  const s = await resourceServer(cfg.apiKey);
  const built = await Promise.all(
    paymentOptions(cfg.payTo).map((o) => s.buildPaymentRequirements(o as Parameters<x402ResourceServer["buildPaymentRequirements"]>[0])),
  );
  return built.flat();
}

export async function paymentRequiredBody(cfg: Extract<SellerConfig, { ok: true }>, requirements: PaymentRequirements[], url: string) {
  const s = await resourceServer(cfg.apiKey);
  return s.createPaymentRequiredResponse(requirements, {
    url,
    description: "Preflight: check a Celo agent before you pay it. ERC-8004 identity, Altana spending key (live, capped, revocable), and who has really paid it.",
    mimeType: "application/json",
  });
}

export function encodeHeader(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
}

export function decodePaymentHeader(value: string | null): PaymentPayload | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64").toString("utf8")) as PaymentPayload;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export type Verified =
  | { ok: true; matched: PaymentRequirements; payer: Address | null }
  | { ok: false; reason: string };

export async function verify(cfg: Extract<SellerConfig, { ok: true }>, payload: PaymentPayload, requirements: PaymentRequirements[]): Promise<Verified> {
  const s = await resourceServer(cfg.apiKey);
  const matched = s.findMatchingRequirements(requirements, payload);
  if (!matched) return { ok: false, reason: "payment_does_not_match_requirements" };
  try {
    const v = await s.verifyPayment(payload, matched);
    if (!v.isValid) return { ok: false, reason: v.invalidReason ?? "invalid_payment" };
    const payer = v.payer && isAddress(v.payer, { strict: false }) ? getAddress(v.payer) : null;
    return { ok: true, matched, payer };
  } catch (error) {
    const reason = (error as { invalidReason?: string })?.invalidReason;
    return { ok: false, reason: reason ?? "facilitator_verify_error" };
  }
}

export async function settle(cfg: Extract<SellerConfig, { ok: true }>, payload: PaymentPayload, matched: PaymentRequirements): Promise<SettleResponse> {
  const s = await resourceServer(cfg.apiKey);
  try {
    return await s.settlePayment(payload, matched);
  } catch (error) {
    const reason = (error as { errorReason?: string })?.errorReason ?? "facilitator_settle_error";
    return { success: false, errorReason: reason, transaction: "", network: matched.network } as SettleResponse;
  }
}
