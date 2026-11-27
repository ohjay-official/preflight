import type { Metadata } from "next";
import { headers } from "next/headers";
import { getAddress, isAddress } from "viem";
import { AddressForm } from "@/components/AddressForm";
import { ReportCard } from "@/components/ReportCard";
import { loadCachedReport } from "@/lib/checks/run";
import { x402Gate } from "@/lib/x402";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ address: string }> }): Promise<Metadata> {
  const { address } = await params;
  if (!isAddress(address, { strict: false })) {
    return {
      title: "Preflight report",
      description: "Check any Celo agent before you pay it or plug it in.",
    };
  }
  const checksum = getAddress(address);
  const short = `${checksum.slice(0, 6)}...${checksum.slice(-4)}`;
  const result = await loadCachedReport(address);
  const title = result.ok ? `Preflight: ${result.report.verdict} for ${short}` : `Preflight report for ${short}`;
  const description = result.ok
    ? result.report.reason
    : "Check any Celo agent before you pay it or plug it in.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

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

  const result = await loadCachedReport(address);
  const jsonUrl = `${await requestOrigin()}/api/check?address=${result.ok ? result.report.address : address}`;
  return (
    <main>
      <h1>Check any Celo agent before you pay it or plug it in.</h1>
      <AddressForm initialValue={address} />
      {result.ok ? <ReportCard report={result.report} jsonUrl={jsonUrl} /> : <p className="error">{result.error}</p>}
    </main>
  );
}

async function requestOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  if (!host) return "";
  return `${proto}://${host}`;
}
