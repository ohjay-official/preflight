import { createPublicClient, http, type Address } from "viem";
import { celo } from "viem/chains";
import { mapPool } from "@/lib/cache";
import { IDENTITY_REGISTRY, rpcUrl } from "@/lib/config";
import { requestWithBackoff } from "@/lib/http";
import { blockChunks, decodeWalletLog, indexWalletLogs, type WalletLog } from "@/lib/identity/logs";

/**
 * Identity registry creation block on Celo mainnet.
 * Creation transaction 0x8464e8da00230016541b555db10f48267d0afb6f2c0626bfc646016554ddc3af.
 */
export const IDENTITY_REGISTRY_START_BLOCK = 58_396_724n;

/** Forno rejects eth_getLogs ranges above 5000 blocks. Blockscout log queries can take more. */
export const WALLET_LOG_CHUNK = 2_000_000n;
const CHUNK_CONCURRENCY = 4;
const INDEX_TTL_MS = 60_000;
const LOG_PAGE_CAP = 1000;

export type WalletLookup = {
  ids: bigint[];
  complete: boolean;
};

let cachedIndex: { at: number; index: WalletLookupIndex } | null = null;
let indexInflight: Promise<WalletLookupIndex> | null = null;

type WalletLookupIndex = {
  byWallet: Map<string, bigint[]>;
  complete: boolean;
};

export async function findAgentIdsForWallet(address: Address): Promise<WalletLookup> {
  try {
    const index = await getWalletIndex();
    const ids = index.byWallet.get(address.toLowerCase()) ?? [];
    return { ids, complete: index.complete };
  } catch {
    return { ids: [], complete: false };
  }
}

async function getWalletIndex(): Promise<WalletLookupIndex> {
  if (cachedIndex && cachedIndex.index.complete && Date.now() - cachedIndex.at < INDEX_TTL_MS) {
    return cachedIndex.index;
  }
  if (!indexInflight) {
    indexInflight = loadWalletIndex()
      .then((index) => {
        if (index.complete) cachedIndex = { at: Date.now(), index };
        return index;
      })
      .finally(() => {
        indexInflight = null;
      });
  }
  return indexInflight;
}

export async function loadWalletIndex(): Promise<WalletLookupIndex> {
  const client = createPublicClient({
    chain: celo,
    transport: http(rpcUrl(), { timeout: 12_000, retryCount: 0 }),
  });
  const tip = await client.getBlockNumber();
  const chunks = blockChunks(IDENTITY_REGISTRY_START_BLOCK, tip, WALLET_LOG_CHUNK);
  const pages = await mapPool(chunks, CHUNK_CONCURRENCY, async (chunk) => {
    try {
      return await fetchChunk(chunk.from, chunk.to);
    } catch {
      return { logs: [] as WalletLog[], complete: false };
    }
  });
  const logs: WalletLog[] = [];
  let complete = true;
  for (const page of pages) {
    logs.push(...page.logs);
    if (!page.complete) complete = false;
  }
  return { byWallet: indexWalletLogs(logs), complete };
}

async function fetchChunk(from: bigint, to: bigint): Promise<{ logs: WalletLog[]; complete: boolean }> {
  const rows = await fetchLogPage(from, to);
  const logs = rows.flatMap((row) => {
    const decoded = decodeWalletLog(row);
    return decoded ? [decoded] : [];
  });
  if (rows.length < LOG_PAGE_CAP) return { logs, complete: true };
  if (to - from < 50_000n) return { logs, complete: false };
  const mid = from + (to - from) / 2n;
  const [left, right] = await Promise.all([fetchChunk(from, mid), fetchChunk(mid + 1n, to)]);
  return {
    logs: [...left.logs, ...right.logs],
    complete: left.complete && right.complete,
  };
}

async function fetchLogPage(from: bigint, to: bigint): Promise<Array<Parameters<typeof decodeWalletLog>[0]>> {
  const url = new URL(process.env.BLOCKSCOUT_API_URL?.trim() || "https://celo.blockscout.com/api");
  url.searchParams.set("module", "logs");
  url.searchParams.set("action", "getLogs");
  url.searchParams.set("fromBlock", from.toString());
  url.searchParams.set("toBlock", to.toString());
  url.searchParams.set("address", IDENTITY_REGISTRY);
  url.searchParams.set("topic0", "0x2c149ed548c6d2993cd73efe187df6eccabe4538091b33adbd25fafdb8a1468b");
  url.searchParams.set("topic0_2_opr", "and");
  url.searchParams.set("topic2", "0x2ac6109326e720d1435c0db66f7e35eda7839f52b6f1f5520a60788e132b4e39");
  url.searchParams.set("page", "1");
  url.searchParams.set("offset", String(LOG_PAGE_CAP));
  const response = await requestWithBackoff(url.toString(), 8_000, { attempts: 2, backoffMs: [200] });
  const body: unknown = await response.json();
  if (!body || typeof body !== "object") return [];
  const result = (body as { result?: unknown; message?: string }).result;
  if (Array.isArray(result)) return result as Array<Parameters<typeof decodeWalletLog>[0]>;
  const message = (body as { message?: string }).message ?? "";
  if (/no logs found/i.test(message)) return [];
  throw new Error(typeof result === "string" ? result : "Blockscout log query failed.");
}

export function clearWalletIndexCache(): void {
  cachedIndex = null;
  indexInflight = null;
}
