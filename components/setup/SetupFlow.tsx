"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPublicClient, formatUnits, http, parseAbi, type Address, type Hex } from "viem";
import { generatePrivateKey } from "viem/accounts";
import { celo } from "viem/chains";
import { KEYSTORE_CONTROLLER, SESSION_DAILY_CAP_USDC, USDC, sessionPermissions } from "@/lib/altana/config";
import { IDENTITY_REGISTRY, KEYSTORE } from "@/lib/config";
import styles from "./setup.module.css";

type Credential = { kind: "webauthn"; id: string; publicKey: Hex; rpId?: string };
type StoredWallet = { address: Address; credential: Credential; createdAt: string };
type StoredSession = { walletAddress: Address; publicKey: Hex; grantTx?: Hex; revokeTx?: Hex; grantedAt: string; revokedAt?: string };
type PendingSecret = { walletAddress: Address; key: Hex; sessionJson: string };
type Identity = { name: string; description: string; endpoint?: string };
type Chain = { celo: bigint; usdc: bigint; fee: bigint; keyStoreKeys: number; agents: bigint };
type AgentInfo = { status?: string; wallet?: string; sessionAddress?: string; expiry?: number; reason?: string; configured?: boolean };

const WALLET_KEY = "preflight.altana.wallet.v1";
const SESSION_KEY = "preflight.altana.session.v1";
const PENDING_KEY = "preflight.altana.pending.v1";

const reader = createPublicClient({ chain: celo, transport: http("https://forno.celo.org") });
const erc20 = parseAbi(["function balanceOf(address owner) view returns (uint256)"]);
const keyStoreAbi = parseAbi(["function getKeys(address user) view returns (bytes32[])"]);
const controllerAbi = parseAbi(["function getRegistrationFeeInWei() view returns (uint256)"]);

function load<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function save(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked: the page still works for this visit */
  }
}

const noSubscribe = () => () => {};
/** True in the browser after hydration, false on the server and during hydration. */
function useIsClient() {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}

function initial<T>(key: string): T | null {
  return typeof window === "undefined" ? null : load<T>(key);
}

function celoscan(kind: "address" | "tx", value: string) {
  return `https://celoscan.io/${kind}/${value}`;
}

function amount(v: bigint, decimals: number, places = 4) {
  const [whole, frac = ""] = formatUnits(v, decimals).split(".");
  return frac ? `${whole}.${frac.slice(0, places)}` : whole;
}

export function SetupFlow(props: {
  rpId: string | null;
  siteUrl: string;
  attributionCode: string | null;
  dailyCapUsdc: string;
  expiryUnix: number;
  identity: Identity;
}) {
  const isClient = useIsClient();
  const host = isClient ? window.location.hostname : null;
  const [wallet, setWallet] = useState<StoredWallet | null>(() => initial<StoredWallet>(WALLET_KEY));
  const [session, setSession] = useState<StoredSession | null>(() => initial<StoredSession>(SESSION_KEY));
  const [pending, setPending] = useState<PendingSecret | null>(() => initial<PendingSecret>(PENDING_KEY));
  const [chain, setChain] = useState<Chain | null>(null);
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [quote, setQuote] = useState<string[] | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const onRightHost = Boolean(props.rpId && host === props.rpId);

  const refresh = useCallback(async (address: Address) => {
    try {
      const [celoBal, usdc, fee, keys, agents] = await Promise.all([
        reader.getBalance({ address }),
        reader.readContract({ address: USDC, abi: erc20, functionName: "balanceOf", args: [address] }),
        reader.readContract({ address: KEYSTORE_CONTROLLER, abi: controllerAbi, functionName: "getRegistrationFeeInWei" }),
        reader.readContract({ address: KEYSTORE, abi: keyStoreAbi, functionName: "getKeys", args: [address] }).catch(() => [] as readonly Hex[]),
        reader.readContract({ address: IDENTITY_REGISTRY, abi: erc20, functionName: "balanceOf", args: [address] }).catch(() => 0n),
      ]);
      setChain({ celo: celoBal, usdc, fee, keyStoreKeys: keys.length, agents });
    } catch (e) {
      setError(`Couldn't read Celo: ${(e as Error).message}`);
    }
    try {
      const r = await fetch("/api/agent", { cache: "no-store" });
      const j = (await r.json()) as { agent?: AgentInfo };
      setAgent(j.agent ?? null);
    } catch {
      setAgent(null);
    }
  }, []);

  // Read balances when the wallet changes. Scheduled, so state updates land in a callback.
  useEffect(() => {
    if (!wallet) return;
    const t = window.setTimeout(() => void refresh(wallet.address), 0);
    return () => window.clearTimeout(t);
  }, [wallet, refresh]);

  async function sdkClient() {
    const sdk = await import("@altananetwork/sdk");
    const client = sdk.createClient({
      chains: [sdk.CELO],
      agentIdentity: props.identity,
      ...(props.attributionCode ? { appCode: props.attributionCode } : {}),
    });
    return { sdk, client };
  }

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message || String(e));
    } finally {
      setBusy("");
    }
  }

  const createWallet = () =>
    run("Waiting for your passkey", async () => {
      if (!props.rpId) throw new Error("The passkey domain isn't set (NEXT_PUBLIC_PASSKEY_RP_ID).");
      const { client } = await sdkClient();
      const result = await client.createPasskeyWallet({ name: "Preflight", rpId: props.rpId });
      const credential = (result.signer as unknown as { credential: Credential }).credential;
      if (credential?.kind !== "webauthn") throw new Error("Unexpected passkey type.");
      const stored: StoredWallet = { address: result.address, credential: { ...credential }, createdAt: new Date().toISOString() };
      save(WALLET_KEY, stored);
      setWallet(stored);
      setNotice("Wallet created. Download the backup file now; until the wallet's first transaction it's the only way back.");
    });

  const findWallet = () =>
    run("Looking for your wallet", async () => {
      if (!props.rpId) throw new Error("The passkey domain isn't set (NEXT_PUBLIC_PASSKEY_RP_ID).");
      const { client } = await sdkClient();
      const result = await client.recoverFromPasskey({ rpId: props.rpId });
      const credential = (result.signer as unknown as { credential: Credential }).credential;
      const stored: StoredWallet = { address: result.address, credential: { ...credential }, createdAt: new Date().toISOString() };
      save(WALLET_KEY, stored);
      setWallet(stored);
    });

  function downloadBackup() {
    if (!wallet) return;
    const blob = new Blob([JSON.stringify({ note: "Preflight agent wallet. Public details only; it can't move money without your passkey.", ...wallet }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `preflight-wallet-${wallet.address.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function restoreFromFile(file: File | undefined) {
    if (!file) return;
    await run("Reading the backup", async () => {
      const parsed = JSON.parse(await file.text()) as StoredWallet;
      if (!parsed?.address || parsed.credential?.kind !== "webauthn") throw new Error("That isn't a Preflight wallet backup.");
      save(WALLET_KEY, parsed);
      setWallet(parsed);
    });
  }

  async function admin() {
    if (!wallet) throw new Error("No wallet on this phone.");
    const { sdk, client } = await sdkClient();
    return { sdk, client, signer: sdk.signerFromPasskey(wallet.credential as never), w: { address: wallet.address } };
  }

  const checkCost = () =>
    run("Asking Altana for the cost", async () => {
      const { sdk, client, signer, w } = await admin();
      const q = await client.quoteGrantSession({
        wallet: w,
        signer,
        permissions: sessionPermissions(),
        expiry: props.expiryUnix,
        sessionSigner: sdk.signerFromPrivateKey(generatePrivateKey()),
        feeToken: USDC,
        feeSpendLimit: SESSION_DAILY_CAP_USDC,
      });
      setQuote(q.lines.map((l) => sdk.formatQuoteLine(l, sdk.CELO)));
    });

  const grant = () =>
    run("Waiting for your passkey", async () => {
      const { sdk, client, signer, w } = await admin();
      const key = generatePrivateKey();
      // Keep the key before granting, so a grant that lands but whose answer is lost isn't orphaned.
      const early: PendingSecret = { walletAddress: w.address, key, sessionJson: "" };
      save(PENDING_KEY, early);
      setPending(early);
      const result = await client.grantSession({
        wallet: w,
        signer,
        permissions: sessionPermissions(),
        expiry: props.expiryUnix,
        sessionSigner: sdk.signerFromPrivateKey(key),
        feeToken: USDC,
        feeSpendLimit: SESSION_DAILY_CAP_USDC,
        register: true,
      });
      if (result.status !== "granted") throw new Error(`The key wasn't granted: ${JSON.stringify(result.legs?.find((l) => l.status === "FAILED") ?? result.status).slice(0, 240)}`);
      const serialized = sdk.serializeSession(result);
      const done: PendingSecret = { walletAddress: w.address, key, sessionJson: JSON.stringify(serialized) };
      save(PENDING_KEY, done);
      setPending(done);
      const stored: StoredSession = {
        walletAddress: w.address,
        publicKey: serialized.publicKey,
        ...(result.transactionHash ? { grantTx: result.transactionHash } : {}),
        grantedAt: new Date().toISOString(),
      };
      save(SESSION_KEY, stored);
      setSession(stored);
      await refresh(w.address);
    });

  function secretsSaved() {
    save(PENDING_KEY, null);
    setPending(null);
    setNotice("Done. Preflight's agent picks the key up on the next deploy. Tap Refresh after Vercel redeploys.");
  }

  const registerIdentity = () =>
    run("Waiting for your passkey", async () => {
      const { client, signer, w } = await admin();
      const out = await client.registerAgentIdentity({ wallet: w, signer, identity: props.identity, feeToken: USDC });
      const o = out as { status: string; agentId?: string; transactionHash?: Hex; reason?: string };
      if (o.status !== "registered") throw new Error(`Not registered: ${o.reason ?? o.status}`);
      setNotice(`Registered as agent ${o.agentId}.${o.transactionHash ? ` Transaction ${o.transactionHash}.` : ""} Send Claude the agent number.`);
      await refresh(w.address);
    });

  const revoke = () =>
    run("Waiting for your passkey", async () => {
      if (!session) throw new Error("No agent key recorded on this phone.");
      const { client, signer, w } = await admin();
      const r = await client.revokeSession({ wallet: w, signer, session: session.publicKey, feeToken: USDC });
      if (r.status !== "revoked") throw new Error("The revoke didn't go through. Nothing changed.");
      const next: StoredSession = { ...session, ...(r.transactionHash ? { revokeTx: r.transactionHash } : {}), revokedAt: new Date().toISOString() };
      save(SESSION_KEY, next);
      setSession(next);
      await refresh(w.address);
    });

  function forget() {
    if (!window.confirm("Remove this wallet from this phone? The money stays in the wallet. You'll need your passkey or the backup file to open it again.")) return;
    save(WALLET_KEY, null);
    setWallet(null);
    setChain(null);
  }

  const firstGrant = chain ? chain.keyStoreKeys === 0 : true;
  const celoNeeded = chain ? (chain.fee * (firstGrant ? 2n : 1n) * 110n) / 100n + 500_000_000_000_000_000n : null;
  const funded = chain && celoNeeded !== null ? chain.celo >= celoNeeded : false;
  const keyActive = Boolean(session && !session.revokedAt);

  if (!isClient) return <p className="muted">Loading…</p>;

  if (!onRightHost) {
    return (
      <section className={styles.panel}>
        <h2>Wrong address for the passkey</h2>
        <p>
          {props.rpId ? (
            <>
              Open <span className="mono">https://{props.rpId}/setup</span> instead. A passkey made on this address would only
              work here, and this isn&apos;t the production site.
            </>
          ) : (
            <>The production address isn&apos;t set yet (NEXT_PUBLIC_PASSKEY_RP_ID). Setup stays locked until it is.</>
          )}
        </p>
      </section>
    );
  }

  return (
    <div className={styles.flow}>
      {busy ? <p className={styles.busy}>{busy}…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {notice ? <p className={styles.notice}>{notice}</p> : null}

      <section className={styles.panel}>
        <p className="kicker">Step 1</p>
        <h2>Wallet</h2>
        {!wallet ? (
          <>
            <p>Your phone saves a passkey named Preflight. That passkey is the only admin of the agent&apos;s wallet.</p>
            <div className={styles.actions}>
              <button onClick={createWallet} disabled={Boolean(busy)}>Create wallet with a passkey</button>
              <button className={styles.secondary} onClick={findWallet} disabled={Boolean(busy)}>Find it with my passkey</button>
              <label className={styles.file}>
                Restore from backup file
                <input type="file" accept="application/json" onChange={(e) => void restoreFromFile(e.target.files?.[0])} />
              </label>
            </div>
            <p className="muted">Finding it with the passkey works once the wallet has made its first transaction.</p>
          </>
        ) : (
          <>
            <p className="mono">{wallet.address}</p>
            <p className="links">
              <a href={celoscan("address", wallet.address)} target="_blank" rel="noreferrer">View on Celoscan</a>
            </p>
            <div className={styles.actions}>
              <button className={styles.secondary} onClick={downloadBackup}>Download backup file</button>
              <button className={styles.secondary} onClick={() => void refresh(wallet.address)} disabled={Boolean(busy)}>Refresh</button>
              <button className={styles.secondary} onClick={forget}>Forget on this phone</button>
            </div>
          </>
        )}
      </section>

      {wallet && chain ? (
        <section className={styles.panel}>
          <p className="kicker">Step 2</p>
          <h2>Fund it</h2>
          <dl className={styles.rows}>
            <dt>CELO</dt>
            <dd className="mono">{amount(chain.celo, 18)}</dd>
            <dt>USDC</dt>
            <dd className="mono">{amount(chain.usdc, 6, 2)}</dd>
            <dt>KeyStore fee now</dt>
            <dd className="mono">{amount(chain.fee, 18, 2)} CELO per key</dd>
            <dt>CELO needed</dt>
            <dd className="mono">{celoNeeded !== null ? amount(celoNeeded, 18, 2) : "…"}</dd>
          </dl>
          <p>
            Send CELO and about $3 of USDC from your exchange, on the <strong>Celo</strong> network, to the address above.
            {firstGrant ? " The first grant registers two keys, your passkey and the agent's, so it pays the fee twice. The extra 10% comes back." : " A new agent key pays the fee once."}
          </p>
          <p>{funded ? "Enough CELO." : "Not enough CELO yet. Tap Refresh after sending."}</p>
        </section>
      ) : null}

      {wallet && chain ? (
        <section className={styles.panel}>
          <p className="kicker">Step 3</p>
          <h2>Agent key</h2>
          {pending?.sessionJson ? (
            <>
              <p>
                Granted. Add these two values to Vercel now: Project, Settings, Environment Variables, Production.
                They&apos;re shown only here, once. Never paste them into a chat.
              </p>
              <SecretRow name="ALTANA_SESSION_KEY" value={pending.key} secret />
              <SecretRow name="ALTANA_SESSION" value={pending.sessionJson} />
              <button onClick={secretsSaved}>I added both to Vercel</button>
            </>
          ) : keyActive && session ? (
            <>
              <dl className={styles.rows}>
                <dt>Status</dt>
                <dd>{agent?.configured ? agent.status : "Waiting for the Vercel values"}</dd>
                <dt>May call</dt>
                <dd>Write a receipt to the ERC-8004 registry, nothing else</dd>
                <dt>Daily cap</dt>
                <dd>${props.dailyCapUsdc} USDC</dd>
                <dt>Expires</dt>
                <dd>{new Date(props.expiryUnix * 1000).toUTCString().slice(0, 16)}</dd>
              </dl>
              {session.grantTx ? (
                <p className="links">
                  <a href={celoscan("tx", session.grantTx)} target="_blank" rel="noreferrer">Grant transaction</a>
                </p>
              ) : null}
              <button className={styles.danger} onClick={revoke} disabled={Boolean(busy)}>Revoke the agent&apos;s key</button>
              <p className="muted">One passkey tap. After that, any attempt by the agent is refused onchain. A revoked key can&apos;t come back.</p>
            </>
          ) : (
            <>
              {session?.revokeTx ? (
                <p>
                  Revoked.{" "}
                  <a href={celoscan("tx", session.revokeTx)} target="_blank" rel="noreferrer">Revoke transaction</a>
                </p>
              ) : null}
              <dl className={styles.rows}>
                <dt>May call</dt>
                <dd>Write a receipt to the ERC-8004 registry, nothing else</dd>
                <dt>Daily cap</dt>
                <dd>${props.dailyCapUsdc} USDC, for Altana&apos;s relay fees</dd>
                <dt>Expires</dt>
                <dd>{new Date(props.expiryUnix * 1000).toUTCString().slice(0, 16)}</dd>
              </dl>
              {quote ? (
                <ul className="stack">
                  {quote.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              ) : null}
              <div className={styles.actions}>
                <button className={styles.secondary} onClick={checkCost} disabled={Boolean(busy)}>Check the cost</button>
                <button onClick={grant} disabled={Boolean(busy) || !funded}>Grant the agent&apos;s key</button>
              </div>
            </>
          )}
        </section>
      ) : null}

      {wallet && chain ? (
        <section className={styles.panel}>
          <p className="kicker">Step 4</p>
          <h2>ERC-8004 identity</h2>
          {chain.agents > 0n ? (
            <p>This wallet owns an agent identity.</p>
          ) : (
            <>
              <p>Registers Preflight in the agent registry from this wallet. Gas only, no fee.</p>
              <button onClick={registerIdentity} disabled={Boolean(busy) || chain.keyStoreKeys === 0}>Register agent identity</button>
              {chain.keyStoreKeys === 0 ? <p className="muted">Available after the first grant.</p> : null}
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}

function SecretRow({ name, value, secret }: { name: string; value: string; secret?: boolean }) {
  const [shown, setShown] = useState(!secret);
  const [copied, setCopied] = useState(false);
  return (
    <div className={styles.secret}>
      <p className="label">{name}</p>
      <p className="mono">{shown ? value : "Hidden. Tap Show, or just Copy."}</p>
      <div className={styles.actions}>
        {secret ? (
          <button className={styles.secondary} onClick={() => setShown((s) => !s)}>{shown ? "Hide" : "Show"}</button>
        ) : null}
        <button
          className={styles.secondary}
          onClick={() => {
            void navigator.clipboard.writeText(value).then(() => setCopied(true));
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
