import type { Metadata } from "next";
import { SetupFlow } from "@/components/setup/SetupFlow";
import {
  SESSION_DAILY_CAP_USDC,
  SESSION_EXPIRY_UNIX,
  agentIdentityRecord,
  passkeyRpId,
  siteUrl,
} from "@/lib/altana/config";

export const metadata: Metadata = {
  title: "Preflight · Agent setup",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The owner's page for Preflight's own agent wallet. Everything that signs happens in this
 * browser with the owner's passkey; the server never sees an admin key.
 */
export default function SetupPage() {
  const site = siteUrl();
  return (
    <main>
      <h1>Agent setup</h1>
      <p className="lede">
        For the owner only. Your passkey controls Preflight&apos;s Altana wallet. The agent gets one capped key that
        can only write receipts, and you can revoke it in one tap.
      </p>
      <SetupFlow
        rpId={passkeyRpId()}
        siteUrl={site}
        attributionCode={process.env.ATTRIBUTION_CODE?.trim() || null}
        dailyCapUsdc={(Number(SESSION_DAILY_CAP_USDC) / 1e6).toFixed(2)}
        expiryUnix={SESSION_EXPIRY_UNIX}
        identity={agentIdentityRecord(site)}
      />
    </main>
  );
}
