import { readAgentState, writeReceipt } from "@/lib/altana/agent";
import { siteUrl } from "@/lib/altana/config";
import { hashReport, selfCheckAgentId } from "@/lib/altana/receipt";
import { loadCachedReport } from "@/lib/checks/run";
import { buildRequirements, decodePaymentHeader, encodeHeader, paymentRequiredBody, sellerConfig, settle, verify } from "@/lib/x402-seller";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NO_STORE = { "cache-control": "no-store" };

/**
 * Paid check for agents: $0.02 in USDC or USD₮ on Celo over x402.
 *
 * Order, so nobody pays for a "no":
 *  1. bad address           → 400, nothing asked
 *  2. agent stopped          → 503, nothing asked (its Altana key is revoked or expired)
 *  3. no payment header      → 402 with the quote
 *  4. payment invalid        → 402 with the reason
 *  5. check fails            → 502, payment not settled
 *  6. settle, then (only if the payer checked itself) write the onchain receipt
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address") ?? "";

  const cfg = sellerConfig();
  if (!cfg.ok) {
    return Response.json(
      { error: "Paid checks open once Preflight's agent wallet is set up.", missing: cfg.missing, free: "/api/check?address=" },
      { status: 503, headers: NO_STORE },
    );
  }

  const agent = await readAgentState();
  if (!agent.configured || agent.status !== "Live") {
    return Response.json(
      {
        error: "Preflight's agent is stopped, so it isn't taking paid checks. You have not been charged.",
        agent: agent.configured ? { wallet: agent.wallet, status: agent.status } : { status: "Not set up" },
      },
      { status: 503, headers: NO_STORE },
    );
  }

  const resourceUrl = `${url.origin}${url.pathname}${address ? `?address=${encodeURIComponent(address)}` : ""}`;
  const requirements = await buildRequirements(cfg);
  const payload = decodePaymentHeader(request.headers.get("payment-signature"));

  if (!payload) {
    const body = await paymentRequiredBody(cfg, requirements, resourceUrl);
    return Response.json(body, { status: 402, headers: { ...NO_STORE, "PAYMENT-REQUIRED": encodeHeader(body) } });
  }

  const verified = await verify(cfg, payload, requirements);
  if (!verified.ok) {
    const body = await paymentRequiredBody(cfg, requirements, resourceUrl);
    return Response.json(
      { ...body, error: verified.reason },
      { status: 402, headers: { ...NO_STORE, "PAYMENT-REQUIRED": encodeHeader({ ...body, error: verified.reason }) } },
    );
  }

  const result = await loadCachedReport(address);
  if (!result.ok) {
    return Response.json({ error: result.error, charged: false }, { status: 400, headers: NO_STORE });
  }
  const report = result.report;
  if (report.checks.some((c) => c.status === "Unread")) {
    return Response.json(
      { error: "Part of the check couldn't be read from Celo right now, so you have not been charged. Try again.", charged: false },
      { status: 502, headers: NO_STORE },
    );
  }

  const settlement = await settle(cfg, payload, verified.matched);
  if (!settlement.success) {
    return Response.json(
      { error: `Payment didn't settle: ${settlement.errorReason ?? "unknown"}. The report is withheld.`, charged: false },
      { status: 402, headers: NO_STORE },
    );
  }

  const base = siteUrl() || url.origin;
  const agentId = verified.payer ? selfCheckAgentId(report, verified.payer) : null;
  const receipt =
    agentId === null
      ? null
      : await writeReceipt({ agentId, verdict: report.verdict, reportUrl: `${base}/report/${report.address}`, reportHash: hashReport(report) });

  return Response.json(
    {
      report,
      payment: { transaction: settlement.transaction, network: settlement.network, payer: verified.payer },
      receipt: receipt ? { agentId: agentId?.toString(), ...receipt } : null,
    },
    { headers: { ...NO_STORE, "PAYMENT-RESPONSE": encodeHeader(settlement) } },
  );
}
