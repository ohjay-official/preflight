import { jsonSafe, readAgentState } from "@/lib/altana/agent";
import { SESSION_DAILY_CAP_USDC, SESSION_EXPIRY_UNIX, passkeyRpId, sessionPermissions, siteUrl } from "@/lib/altana/config";
import { PRICE_ATOMIC, sellerConfig } from "@/lib/x402-seller";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public state of Preflight's own agent: its Altana wallet, whether its session key is live,
 * the caps and allowlist the wallet enforces, and the policy a new grant uses.
 * Everything here is public onchain already. No secret is read into the response.
 */
export async function GET() {
  const state = await readAgentState();
  const cfg = sellerConfig();
  const policy = sessionPermissions();
  return Response.json(
    {
      agent: jsonSafe(state),
      paidCheck: {
        endpoint: "/api/v1/check?address=",
        priceAtomic: PRICE_ATOMIC,
        assets: ["USDC", "USD₮"],
        ready: cfg.ok,
        ...(cfg.ok ? { payTo: cfg.payTo } : { missing: cfg.missing }),
      },
      grantPolicy: {
        calls: policy.calls,
        spend: policy.spend.map((s) => ({ ...s, limit: s.limit.toString() })),
        dailyCapUsdc: (Number(SESSION_DAILY_CAP_USDC) / 1e6).toFixed(2),
        expiry: SESSION_EXPIRY_UNIX,
      },
      attributionCode: process.env.ATTRIBUTION_CODE?.trim() || null,
      passkeyRpId: passkeyRpId(),
      siteUrl: siteUrl() || null,
    },
    {
      headers: { "cache-control": "no-store" },
    },
  );
}
