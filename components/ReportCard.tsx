import { zeroAddress } from "viem";
import { StatusDot } from "@/components/StatusDot";
import { shortList } from "@/lib/format";
import type {
  AttributionCheck,
  Check,
  IdentityCheck,
  KeystoreCheck,
  PaymentsCheck,
  Report,
  Verdict,
} from "@/lib/types";

export function ReportCard({ report }: { report: Report }) {
  const jsonHref = `/api/check?address=${report.address}`;
  const explorer = `https://celo.blockscout.com/address/${report.address}`;
  return (
    <article className="card">
      <p className="kicker">Report for</p>
      <p className="mono">{report.address}</p>
      <p className="muted">
        Celo mainnet, chain {report.chainId}. Read at {report.generatedAt}.
      </p>
      <div className={`verdict verdict-${verdictTone(report.verdict)}`}>
        <h2>{report.verdict}</h2>
        <p>{report.reason}</p>
      </div>
      {report.checks.map((check) => (
        <CheckSection key={check.id} check={check} />
      ))}
      <p className="muted">
        {report.x402.note} Planned price {report.x402.priceUsd} USD per check.
      </p>
      <p className="links">
        <a href={jsonHref}>JSON</a>
        <a href={explorer}>Address on Blockscout</a>
      </p>
    </article>
  );
}

function CheckSection({ check }: { check: Check }) {
  return (
    <section className="check">
      <h3>
        <span>{check.title}</span>
        <StatusDot status={check.status} />
      </h3>
      <p>{check.summary}</p>
      {check.id === "identity" ? <IdentityBody check={check} /> : null}
      {check.id === "keystore" ? <KeystoreBody check={check} /> : null}
      {check.id === "payments" ? <PaymentsBody check={check} /> : null}
      {check.id === "attribution" ? <AttributionBody check={check} /> : null}
    </section>
  );
}

function IdentityBody({ check }: { check: IdentityCheck }) {
  if (check.records.length === 0) return null;
  return (
    <ul className="stack">
      {check.records.map((record) => (
        <li key={record.tokenId}>
          <p>
            Agent {record.tokenId}, matched as {record.matchedAs}
            {record.name ? `, ${record.name}` : ""}
          </p>
          <p className="mono">Owner {record.owner}</p>
          <p className="mono">
            Agent wallet {record.agentWallet === zeroAddress ? "Not set" : record.agentWallet}
          </p>
        </li>
      ))}
    </ul>
  );
}

function KeystoreBody({ check }: { check: KeystoreCheck }) {
  return (
    <>
      <p className="muted">{check.note}</p>
      {check.keys.length > 0 ? (
        <ul className="stack">
          {check.keys.map((key) => (
            <li key={key.keyId} className="key">
              <div className="key-top">
                <span>{key.role}</span>
                <StatusDot status={key.status} />
              </div>
              <p className="mono">{key.keyId}</p>
              <p className="muted">Expiry: {key.expiry}</p>
              <p className="muted">Metadata: {key.metadataBytes} bytes</p>
              {key.metadataHex ? <p className="mono">{key.metadataHex}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function PaymentsBody({ check }: { check: PaymentsCheck }) {
  const payers = shortList(check.payers, 8);
  return (
    <>
      {check.assets.length > 0 ? (
        <ul className="stack">
          {check.assets.map((asset) => (
            <li key={asset.asset}>
              {asset.asset}: {asset.amount} across {asset.paymentCount} payment
              {asset.paymentCount === 1 ? "" : "s"}
            </li>
          ))}
        </ul>
      ) : null}
      {payers.shown.length > 0 ? (
        <>
          <p className="label">Payers</p>
          <ul className="stack">
            {payers.shown.map((payer) => (
              <li key={payer} className="mono">
                {payer}
              </li>
            ))}
          </ul>
          {payers.extra > 0 ? <p className="muted">and {payers.extra} more</p> : null}
        </>
      ) : null}
      {check.fundingLinks.length > 0 ? (
        <>
          <p className="label">Funding links</p>
          <ul className="stack">
            {check.fundingLinks.map((link) => (
              <li key={`${link.transactionHash}-${link.payer}-${link.asset}`}>
                {link.funderRole} sent {link.asset} to {link.payer}.{" "}
                <a href={`https://celo.blockscout.com/tx/${link.transactionHash}`}>Transaction</a>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}

function AttributionBody({ check }: { check: AttributionCheck }) {
  return (
    <>
      <p className="muted">{check.note}</p>
      {check.codes.length > 0 ? <p className="mono">{check.codes.join(", ")}</p> : null}
    </>
  );
}

function verdictTone(verdict: Verdict): "ok" | "caution" | "stop" {
  if (verdict === "OK to pay") return "ok";
  if (verdict === "Small amounts only") return "caution";
  return "stop";
}
