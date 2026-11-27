// Shared helpers for the read-only mainnet tests. No keys, no signing, nothing sent.
import fs from "node:fs";
import path from "node:path";
import { createPublicClient, fallback, http } from "viem";
import { celo } from "viem/chains";

export const client = createPublicClient({
  chain: celo,
  transport: fallback([
    http("https://forno.celo.org", { timeout: 30_000 }),
    http("https://celo-rpc.publicnode.com", { timeout: 30_000 }),
  ]),
});

// Addresses on Celo mainnet. Sources in docs/test-results.md.
export const A = {
  keyStore: "0x83b30935f36d6ccf9B1ec3b5E47F2866b97cd27c",
  keyStoreController: "0x47bA5fc2A5b0CcB24BA3fAC9D4B59400eE9fd1D6",
  erc8004Identity: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  USDC: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
  USDT: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
};

// Other entrants' public wallets and transactions, used only as read-only evidence.
export const RIVALS = {
  hexboxAltanaWallet: "0xC17733165C47f80E56b1c6eD61E8988296CA8f82",
  hexboxSpendingKey: "0xB18095490A9f775d22Ffd7ce7b833AaC510A95ad",
  errandAgent: "0xc64d2153Bd39053913667A5c2eec8250d8AbC005",
  tractionCheckPayTo: "0x3Fc08CFfDBAEf388Dc60096935379AE3c603CB0e",
  agentGuardPayTo: "0x00D96E0A1b77ff3f6EA5BF5Df1b5A177f75d1319",
};

export const RESULTS_DIR = path.resolve(process.env.RESULTS_DIR || "results");

export const j = (o) => JSON.stringify(o, (_k, v) => (typeof v === "bigint" ? v.toString() : v), 2);

export function save(name, obj) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const file = path.join(RESULTS_DIR, `${name}.json`);
  fs.writeFileSync(file, j(obj) + "\n");
  console.log(`wrote ${file}`);
}

export function load(name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, `${name}.json`), "utf8"));
  } catch {
    return null;
  }
}

export async function getJson(url, { timeoutMs = 30_000, init } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal, headers: { accept: "application/json", ...(init?.headers || {}) } });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}: ${text.slice(0, 300)}`);
    return JSON.parse(text);
  } finally {
    clearTimeout(t);
  }
}

export async function timed(fn) {
  const t0 = performance.now();
  const value = await fn();
  return { value, ms: Math.round(performance.now() - t0) };
}

export function errMsg(e) {
  return String(e?.shortMessage || e?.message || e).slice(0, 500);
}
