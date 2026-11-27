// Test 1: can Preflight read an agent's Altana keys, and tell live, revoked and expired apart?
// Reads Altana's public KeyStore and the wallet account itself. Read-only.
//
// Until our own wallet exists, this reads other entrants' public Altana wallets
// (found from KeyStore events) as evidence. Re-run with T1_WALLETS=<our wallet> after setup,
// and again after the revoke.
import { parseAbi, decodeEventLog, getAddress, isAddress, keccak256 } from "viem";
import { client, A, RIVALS, save, getJson, errMsg } from "./lib.mjs";

const out = { test: "t1-keys", startedAt: new Date().toISOString(), notes: [] };

// Account-level views on an Altana wallet (EIP-7702 delegated account), as used in
// HexboxTools/celo-spendguard scripts/session-status.mjs.
const accountAbi = parseAbi([
  "function getKeys() view returns ((uint40 expiry,uint8 keyType,bool isSuperAdmin,bytes publicKey)[] keys, bytes32[] keyHashes)",
  "function canExecutePackedInfos(bytes32 keyHash) view returns (bytes32[])",
  "function spendInfos(bytes32 keyHash) view returns ((address token,uint8 period,uint256 limit,uint256 spent,uint256 lastUpdated,uint256 currentSpent,uint256 current)[])",
]);
const controllerAbi = parseAbi(["function getRegistrationFeeInWei() view returns (uint256)"]);

async function keyStoreAbi() {
  const sources = [
    ["blockscout getabi", async () => {
      const r = await getJson(`https://celo.blockscout.com/api?module=contract&action=getabi&address=${A.keyStore}`);
      if (r.status !== "1") throw new Error(JSON.stringify(r).slice(0, 200));
      return JSON.parse(r.result);
    }],
    ["blockscout v2", async () => {
      const r = await getJson(`https://celo.blockscout.com/api/v2/smart-contracts/${A.keyStore}`);
      if (!r.abi) throw new Error("no abi field");
      return r.abi;
    }],
    ["sourcify", async () => {
      const r = await getJson(`https://sourcify.dev/server/v2/contract/42220/${A.keyStore}?fields=abi`);
      if (!r.abi) throw new Error("no abi field");
      return r.abi;
    }],
  ];
  for (const [name, fn] of sources) {
    try {
      const abi = await fn();
      out.abiSource = name;
      return abi;
    } catch (e) {
      out.notes.push(`ABI from ${name} failed: ${errMsg(e)}`);
    }
  }
  return null;
}

async function sdkFacts() {
  try {
    const sdk = await import("@altananetwork/sdk");
    const names = Object.keys(sdk).sort();
    out.sdkExports = names;
    const celo = sdk.CELO;
    if (celo) out.sdkCeloConfig = celo;
  } catch (e) {
    out.notes.push(`SDK import failed: ${errMsg(e)}`);
  }
}

async function scanKeyStoreLogs(abi) {
  const latest = await client.getBlockNumber();
  const span = BigInt(process.env.T1_SCAN_BLOCKS || 1_300_000); // about 15 days at 1 s blocks
  const from = latest > span ? latest - span : 0n;
  let step = BigInt(process.env.T1_STEP || 5_000);
  const logs = [];
  for (let start = from; start <= latest; ) {
    const end = start + step - 1n > latest ? latest : start + step - 1n;
    try {
      logs.push(...(await client.getLogs({ address: A.keyStore, fromBlock: start, toBlock: end })));
      start = end + 1n;
    } catch (e) {
      if (step <= 500n) { out.notes.push(`log scan stopped at ${start}: ${errMsg(e)}`); break; }
      step /= 2n;
    }
  }
  out.logScan = { fromBlock: from, toBlock: latest, finalStep: step, logs: logs.length };
  const events = {};
  const wallets = new Set();
  const revokes = [];
  for (const l of logs) {
    let d = null;
    try { d = decodeEventLog({ abi, data: l.data, topics: l.topics }); } catch { /* unknown event */ }
    const name = d?.eventName || `unknown:${l.topics[0]}`;
    events[name] = (events[name] || 0) + 1;
    const args = d?.args || {};
    for (const v of Object.values(args)) if (typeof v === "string" && isAddress(v)) wallets.add(getAddress(v));
    if (/revok|remov|delet/i.test(name)) revokes.push({ event: name, args, tx: l.transactionHash, block: l.blockNumber });
  }
  out.events = events;
  out.revokeEvents = revokes;
  return { wallets: [...wallets], revokes };
}

async function readKeyStore(abi, user, keyIds) {
  const views = abi.filter((f) => f.type === "function" && ["view", "pure"].includes(f.stateMutability));
  const perKey = views.filter((f) => f.inputs.length === 2 && f.inputs[0].type === "address" && f.inputs[1].type === "bytes32");
  const r = {};
  for (const id of keyIds) {
    r[id] = {};
    for (const f of perKey) {
      try { r[id][f.name] = await client.readContract({ address: A.keyStore, abi, functionName: f.name, args: [user, id] }); }
      catch (e) { r[id][f.name] = `error: ${errMsg(e).slice(0, 120)}`; }
    }
  }
  return r;
}

async function readAccount(user) {
  const r = {};
  try { r.code = await client.getCode({ address: user }); r.delegatedTo = r.code?.startsWith("0xef0100") ? "0x" + r.code.slice(8, 48) : null; }
  catch (e) { r.codeErr = errMsg(e); }
  try {
    const [keys, hashes] = await client.readContract({ address: user, abi: accountAbi, functionName: "getKeys" });
    r.keys = [];
    for (let i = 0; i < keys.length; i++) {
      const k = { keyHash: hashes[i], ...keys[i], expiryIso: keys[i].expiry ? new Date(Number(keys[i].expiry) * 1000).toISOString() : null };
      k.keyStoreIdGuess = keccak256(keys[i].publicKey);
      if (!keys[i].isSuperAdmin) {
        try {
          k.mayCall = (await client.readContract({ address: user, abi: accountAbi, functionName: "canExecutePackedInfos", args: [hashes[i]] }))
            .map((p) => ({ target: "0x" + p.slice(2, 42), selector: "0x" + p.slice(-8) }));
        } catch (e) { k.mayCallErr = errMsg(e); }
        try { k.spend = await client.readContract({ address: user, abi: accountAbi, functionName: "spendInfos", args: [hashes[i]] }); }
        catch (e) { k.spendErr = errMsg(e); }
      }
      r.keys.push(k);
    }
  } catch (e) { r.accountErr = errMsg(e); }
  return r;
}

await sdkFacts();
try { out.registrationFeeWei = await client.readContract({ address: A.keyStoreController, abi: controllerAbi, functionName: "getRegistrationFeeInWei" }); }
catch (e) { out.notes.push(`fee read failed: ${errMsg(e)}`); }

const abi = await keyStoreAbi();
if (abi) {
  out.keyStoreViews = abi.filter((f) => f.type === "function" && ["view", "pure"].includes(f.stateMutability)).map((f) => `${f.name}(${f.inputs.map((i) => i.type).join(",")})`);
  out.keyStoreEvents = abi.filter((f) => f.type === "event").map((f) => `${f.name}(${f.inputs.map((i) => `${i.type}${i.indexed ? " indexed" : ""} ${i.name}`).join(", ")})`);
}

let wallets = (process.env.T1_WALLETS || "").split(",").map((s) => s.trim()).filter(Boolean);
let revokes = [];
if (abi && !wallets.length) {
  try { ({ wallets, revokes } = await scanKeyStoreLogs(abi)); } catch (e) { out.notes.push(`log scan failed: ${errMsg(e)}`); }
}
if (!wallets.includes(RIVALS.hexboxAltanaWallet)) wallets.unshift(RIVALS.hexboxAltanaWallet);
wallets = wallets.filter((w) => ![A.keyStore, A.keyStoreController].includes(w)).slice(0, Number(process.env.T1_MAX_WALLETS || 40));

out.wallets = [];
for (const user of wallets) {
  const w = { user };
  if (abi) {
    try { w.keyStoreKeys = await client.readContract({ address: A.keyStore, abi, functionName: "getKeys", args: [user] }); }
    catch (e) { w.keyStoreKeysErr = errMsg(e); }
    if (Array.isArray(w.keyStoreKeys) && w.keyStoreKeys.length) w.keyStore = await readKeyStore(abi, user, w.keyStoreKeys);
  }
  w.account = await readAccount(user);
  out.wallets.push(w);
}

// Revoked keys found in events: read them back to see what a revoked key looks like.
out.revokedReads = [];
for (const r of revokes.slice(0, 10)) {
  const user = Object.values(r.args).find((v) => typeof v === "string" && isAddress(v));
  const keyId = Object.values(r.args).find((v) => typeof v === "string" && /^0x[0-9a-f]{64}$/i.test(v));
  if (abi && user && keyId) out.revokedReads.push({ tx: r.tx, user, keyId, reads: (await readKeyStore(abi, user, [keyId]))[keyId] });
}

// Summary flags for docs/test-results.md
const sessions = out.wallets.flatMap((w) => (w.account.keys || []).filter((k) => !k.isSuperAdmin).map((k) => ({ user: w.user, ...k })));
out.summary = {
  walletsRead: out.wallets.length,
  walletsWithAccountKeys: out.wallets.filter((w) => w.account.keys?.length).length,
  sessionKeysFound: sessions.length,
  sessionKeysWithCapsReadable: sessions.filter((s) => Array.isArray(s.spend) && s.spend.length).length,
  sessionKeysWithAllowlistReadable: sessions.filter((s) => Array.isArray(s.mayCall)).length,
  sessionKeysInKeyStore: out.wallets.reduce((n, w) => n + Object.values(w.keyStore || {}).filter((k) => k.isRootKey === false).length, 0),
  revokeEventsFound: out.revokeEvents?.length ?? 0,
};
out.finishedAt = new Date().toISOString();
save("t1-keys", out);
