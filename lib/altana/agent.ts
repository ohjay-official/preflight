import { createPublicClient, getAddress, http, type Address, type Hex, type PublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import { keystoreAbi } from "@/lib/abi/keystore";
import { addressFromPublicKey, keyStoreKeyId, readAccountKeys, type AccountKey } from "@/lib/altana/account";
import { REPUTATION_REGISTRY, USDC } from "@/lib/altana/config";
import { encodeReceipt } from "@/lib/altana/receipt";
import { KEYSTORE, rpcUrl } from "@/lib/config";
import type { Verdict } from "@/lib/types";

/**
 * Preflight's own agent, server side. It acts from the Altana wallet Oh-Jay controls with his
 * phone passkey, through a capped session key. Two Vercel env values, both set by him after
 * the grant (docs/oh-jay-todo.md, step 3):
 *   ALTANA_SESSION      serializeSession() output: wallet, public key, permissions, expiry. Public.
 *   ALTANA_SESSION_KEY  the session's private key. Secret. Never logged, never returned.
 * No admin key or seed exists on the server.
 */

type StoredSession = { walletAddress: Address; publicKey: Hex; permissions: unknown; expiry: number };

export type AgentState =
  | { configured: false; reason: string }
  | {
      configured: true;
      wallet: Address;
      sessionAddress: Address;
      status: "Live" | "Revoked" | "Expired";
      expiry: number;
      /** The session as the wallet account holds it, with caps and allowlist. Null once revoked. */
      accountKey: AccountKey | null;
      /** KeyStore view of the same key. */
      keyStore: { keyId: Hex; registered: boolean; revoked: boolean | null };
    };

/** bigint-safe copy for JSON responses. */
export function jsonSafe<T>(value: T): unknown {
  return JSON.parse(JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v)));
}

function publicClient(): PublicClient {
  return createPublicClient({ chain: celo, transport: http(rpcUrl()) }) as PublicClient;
}

function readEnvSession(): { session: StoredSession; key: Hex } | { error: string } {
  const raw = process.env.ALTANA_SESSION?.trim();
  const key = process.env.ALTANA_SESSION_KEY?.trim() as Hex | undefined;
  if (!raw || !key) return { error: "The agent's session is not set up yet (ALTANA_SESSION and ALTANA_SESSION_KEY)." };
  let session: StoredSession;
  try {
    session = JSON.parse(raw) as StoredSession;
  } catch {
    return { error: "ALTANA_SESSION is not valid JSON." };
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) return { error: "ALTANA_SESSION_KEY is not a 32-byte hex key." };
  const derived = privateKeyToAccount(key).address;
  if (getAddress(addressFromPublicKey(session.publicKey)) !== derived) {
    return { error: "ALTANA_SESSION_KEY does not match ALTANA_SESSION's public key." };
  }
  return { session, key };
}

/** Is the agent allowed to act right now? Read from the chain, never from memory. */
export async function readAgentState(client: PublicClient = publicClient()): Promise<AgentState> {
  const env = readEnvSession();
  if ("error" in env) return { configured: false, reason: env.error };
  const wallet = getAddress(env.session.walletAddress);
  const sessionAddress = addressFromPublicKey(env.session.publicKey);
  const keyId = keyStoreKeyId(env.session.publicKey);
  const nowUnix = Math.floor(Date.now() / 1000);

  const [keys, ksKey] = await Promise.all([
    readAccountKeys(client, wallet),
    client
      .readContract({ address: KEYSTORE, abi: keyStoreGetKeyAbi, functionName: "getKey", args: [wallet, keyId] })
      .catch(() => null),
  ]);
  const accountKey = keys?.find((k) => k.address && getAddress(k.address) === sessionAddress) ?? null;
  const registered = Boolean(ksKey && ksKey.publicKey && ksKey.publicKey !== "0x");
  const revokedInKeyStore = registered ? Boolean(ksKey?.revoked) : null;

  let status: "Live" | "Revoked" | "Expired";
  if (env.session.expiry && nowUnix >= env.session.expiry) status = "Expired";
  else if (!accountKey || revokedInKeyStore) status = "Revoked";
  else status = "Live";

  return {
    configured: true,
    wallet,
    sessionAddress,
    status,
    expiry: env.session.expiry,
    accountKey,
    keyStore: { keyId, registered, revoked: revokedInKeyStore },
  };
}

/** KeyStore.getKey, from the verified KeyStore ABI (test 1 read it on mainnet). */
const keyStoreGetKeyAbi = [
  ...keystoreAbi,
  {
    type: "function",
    name: "getKey",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "keyId", type: "bytes32" },
    ],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "validator", type: "address" },
          { name: "publicKey", type: "bytes" },
          { name: "metadata", type: "bytes" },
          { name: "nonce", type: "uint64" },
          { name: "lastUpdated", type: "uint40" },
          { name: "revoked", type: "bool" },
          { name: "expiry", type: "uint40" },
          { name: "isRoot", type: "bool" },
        ],
      },
    ],
  },
] as const;

export type ReceiptOutcome = { status: "CONFIRMED" | "FAILED" | "PENDING" | "SKIPPED"; transactionHash?: Hex; detail?: string };

/**
 * Writes the receipt from the Altana wallet under the session. The account enforces the
 * allowlist (this one function on the Reputation Registry), the USDC cap and the expiry:
 * a revoked session reverts at validation, so the agent can't act after a revoke.
 * The ERC-8021 tag rides on the call (SDK appCode): `altana,<ATTRIBUTION_CODE>`.
 */
export async function writeReceipt(input: { agentId: bigint; verdict: Verdict; reportUrl: string; reportHash: Hex }): Promise<ReceiptOutcome> {
  const env = readEnvSession();
  if ("error" in env) return { status: "SKIPPED", detail: env.error };
  const code = process.env.ATTRIBUTION_CODE?.trim();
  if (!code) return { status: "SKIPPED", detail: "ATTRIBUTION_CODE is not set; refusing to send an untagged transaction." };

  const sdk = await import("@altananetwork/sdk");
  const client = sdk.createClient({ chains: [sdk.CELO], appCode: code, agentIdentity: false });
  const session = sdk.deserializeSession(env.session as never, sdk.signerFromPrivateKey(env.key));
  try {
    const result = await client.execute({
      session,
      calls: [{ to: REPUTATION_REGISTRY, data: encodeReceipt(input), value: 0n }],
      feeToken: USDC,
    });
    return {
      status: result.status,
      ...(result.transactionHash ? { transactionHash: result.transactionHash } : {}),
    };
  } catch (error) {
    return { status: "FAILED", detail: String((error as Error)?.message ?? error).slice(0, 300) };
  }
}
