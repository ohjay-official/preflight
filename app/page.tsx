import { AddressForm } from "@/components/AddressForm";

export default function HomePage() {
  return (
    <main>
      <h1>Check any Celo agent before you pay it or plug it in.</h1>
      <p className="lede">
        Paste an agent wallet address. Preflight reads Celo mainnet and returns one verdict: OK to
        pay, Small amounts only, or Don&apos;t pay. The checks are fixed rules. There is no score out of
        100.
      </p>
      <AddressForm />
      <section className="card" aria-labelledby="report-heading">
        <h2 id="report-heading">Report</h2>
        <p>Run a check to fill this card. The filled report opens on its own page.</p>
        <ul>
          <li>Who is it</li>
          <li>Can it be stopped</li>
          <li>Has anyone real paid it</li>
        </ul>
      </section>
      <section className="rules" id="rules">
        <h2>How the verdict is chosen</h2>
        <p>Don&apos;t pay if no ERC-8004 identity is found, or if the keystore has no live key.</p>
        <p>
          Small amounts only if those two pass, but fewer than two distinct payers paid in 30 days, a
          funding link was found, or the payment history is missing or incomplete.
        </p>
        <p>
          OK to pay only when the identity is registered, a key is live, at least two distinct payers
          paid in the last 30 days, and no funding link was found.
        </p>
        <p>A missing funding link is reported as &quot;No funding link found.&quot;</p>
      </section>
    </main>
  );
}
