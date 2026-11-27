import { loadReport } from "@/lib/checks/run";
import { x402Gate } from "@/lib/x402";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const gate = x402Gate();
  if (gate.blocked) {
    return Response.json(gate.body, {
      status: 402,
      headers: { "cache-control": "no-store" },
    });
  }

  const address = new URL(request.url).searchParams.get("address") ?? "";
  const result = await loadReport(address);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400, headers: { "cache-control": "no-store" } });
  }
  return Response.json(result.report, { headers: { "cache-control": "no-store" } });
}
