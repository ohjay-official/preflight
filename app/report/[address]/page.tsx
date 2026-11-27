import { AddressForm } from "@/components/AddressForm";
import { ReportCard } from "@/components/ReportCard";
import { loadReport } from "@/lib/checks/run";
import { x402Gate } from "@/lib/x402";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const gate = x402Gate();
  if (gate.blocked) {
    return (
      <main>
        <h1>Check any Celo agent before you pay it or plug it in.</h1>
        <AddressForm initialValue={address} />
        <p className="error">{gate.body.error}</p>
      </main>
    );
  }

  const result = await loadReport(address);
  return (
    <main>
      <h1>Check any Celo agent before you pay it or plug it in.</h1>
      <AddressForm initialValue={address} />
      {result.ok ? <ReportCard report={result.report} /> : <p className="error">{result.error}</p>}
    </main>
  );
}
