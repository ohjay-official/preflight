// Test 2: does the ERC-8021 attribution tag survive Altana's relay, as Celo's own checker reads it?
// Runs @celo/attribution-tags verifyTx on real mainnet transactions. Read-only.
//
// Evidence until our own wallet exists: Hexbox's relayed Altana transactions (grant and a
// session-key execute) and plain EOA transactions as a control. Re-run with T2_TXS=<hashes>
// on our own grant, execute and revoke.
import * as tags from "@celo/attribution-tags";
import { client, save, load, errMsg } from "./lib.mjs";

const out = { test: "t2-tag", startedAt: new Date().toISOString(), exports: Object.keys(tags).sort(), txs: [] };

const defaults = [
  { label: "hexbox: Altana session-key execute via relay (USDC.transfer top-up)", hash: "0xb460d2bd872edc4d19c1f85e63adc174564439cabe66ac01141b0b8d3f1c0227" },
  { label: "hexbox: Altana grant via relay (KeyStore registration + session grant)", hash: "0xaf680c1b453efad02812cd9ed8abdc143b7879ba68813bbf46d80217b43593cd" },
  { label: "hexbox: admin self-call setCanExecute (EOA, tagged with withAttribution)", hash: "0x6c25718b7aa8288be290f87a13fb62328e28030143a8608c4dab57c847aaadc4" },
  { label: "hexbox: ERC-8004 registration (EOA, control)", hash: "0xe47d71bb03cc18e736e43b0a3a5d9a31b750db81ec299da6c9205f631feb36e4" },
  { label: "errand: ERC-8004 registration (EOA, control)", hash: "0x8b6048637d36104e7c89d85efee0e1be8e9696fa7f00e485b79b9ee76f162b7c" },
];
const fromEnv = (process.env.T2_TXS || "").split(",").map((s) => s.trim()).filter(Boolean).map((hash) => ({ label: "env", hash }));
const fromT1 = (load("t1-keys")?.revokeEvents || []).slice(0, 3).map((r) => ({ label: `revoke event ${r.event} (from t1)`, hash: r.tx }));
const list = [...fromEnv, ...defaults, ...fromT1];

for (const { label, hash } of list) {
  const r = { label, hash };
  try {
    const tx = await client.getTransaction({ hash });
    r.from = tx.from;
    r.to = tx.to;
    r.selector = tx.input.slice(0, 10);
    r.inputBytes = (tx.input.length - 2) / 2;
    r.type = tx.type;
    try { r.fromDataSuffix = tags.fromDataSuffix?.(tx.input) ?? "n/a"; } catch (e) { r.fromDataSuffixErr = errMsg(e); }
    try { r.fromOrchestratorCalldata = tags.fromOrchestratorCalldata?.(tx.input) ?? "n/a"; } catch (e) { r.fromOrchestratorErr = errMsg(e); }
    const rc = await client.getTransactionReceipt({ hash });
    r.status = rc.status;
  } catch (e) {
    r.txErr = errMsg(e);
  }
  try { r.verifyTx = await tags.verifyTx({ client, hash }); } catch (e) { r.verifyTxErr = errMsg(e); }
  r.codesSeen = Array.isArray(r.verifyTx?.codes) ? r.verifyTx.codes : null;
  out.txs.push(r);
}

out.summary = out.txs.map((t) => ({ label: t.label, status: t.status, codesSeen: t.codesSeen, verifyTxErr: t.verifyTxErr || null }));
out.finishedAt = new Date().toISOString();
save("t2-tag", out);
