import {
  createPublicClient,
  getAddress,
  hexToBigInt,
  http,
  pad,
  type Address,
  type Hex,
} from "viem";
import { celo } from "viem/chains";
import { mapPool } from "@/lib/cache";
import { rpcUrl } from "@/lib/config";
import type { NormalizedTokenTransfer } from "@/lib/activity/types";

/** Forno's eth_getLogs cap, measured 27 Nov 2026. */
export const RPC_LOG_CHUNK = 5_000n;
const CONCURRENCY = 16;
const BUDGET_MS = 4_500;

const TRANSFER_TOPIC: Hex = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const erc20Abi = [
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
] as const;

export type TokenLogRead = {
  transfers: NormalizedTokenTransfer[];
  complete: boolean;
};

type RpcLog = {
  address: Address;
  blockNumber: bigint | null;
  transactionHash: Hex | null;
  topics: Hex[];
  data: Hex;
};

type LogClient = {
  getBlockNumber(): Promise<bigint>;
  getBlock(args: { blockNumber: bigint }): Promise<{ timestamp: bigint }>;
  getLogs(args: { fromBlock: bigint; toBlock: bigint; topics: readonly [Hex, null, Hex] }): Promise<RpcLog[]>;
  multicall(args: {
    allowFailure: true;
    contracts: ReadonlyArray<{
      address: Address;
      abi: typeof erc20Abi;
      functionName: "symbol" | "decimals";
    }>;
  }): Promise<ReadonlyArray<{ status: string; result?: unknown }>>;
};

export async function readIncomingTokenLogs(
  address: Address,
  sinceUnix: number,
  client: LogClient = defaultClient(),
  now = Date.now(),
): Promise<TokenLogRead> {
  const tip = await client.getBlockNumber();
  const latest = await client.getBlock({ blockNumber: tip });
  const latestTs = Number(latest.timestamp);
  const secondsBack = Math.max(0, latestTs - sinceUnix);
  const fromBlock = tip > BigInt(secondsBack) ? tip - BigInt(secondsBack) : 0n;
  const chunks: Array<{ from: bigint; to: bigint }> = [];
  for (let to = tip; to >= fromBlock; to -= RPC_LOG_CHUNK) {
    const from = to - RPC_LOG_CHUNK + 1n < fromBlock ? fromBlock : to - RPC_LOG_CHUNK + 1n;
    chunks.push({ from, to });
    if (from === fromBlock) break;
  }

  const deadline = now + BUDGET_MS;
  const collected: NormalizedTokenTransfer[] = [];
  let scanned = 0;
  await mapPool(chunks, CONCURRENCY, async (chunk) => {
    if (Date.now() > deadline) return;
    const logs = await client.getLogs({
      fromBlock: chunk.from,
      toBlock: chunk.to,
      topics: [TRANSFER_TOPIC, null, pad(address, { size: 32 })],
    });
    scanned += 1;
    for (const log of logs) {
      const transfer = transferFromLog(log, address, tip, latestTs);
      if (transfer && transfer.timestamp >= sinceUnix) collected.push(transfer);
    }
  });

  const unique = dedupe(collected);
  await attachTokenMetadata(client, unique);
  return { transfers: unique, complete: scanned === chunks.length };
}

function transferFromLog(
  log: RpcLog,
  recipient: Address,
  tip: bigint,
  latestTs: number,
): NormalizedTokenTransfer | null {
  if (!log.transactionHash || log.blockNumber === null || log.topics.length < 3) return null;
  const from = addressFromTopic(log.topics[1]);
  const to = addressFromTopic(log.topics[2]);
  if (!from || !to || to.toLowerCase() !== recipient.toLowerCase()) return null;
  let value = 0n;
  try {
    value = hexToBigInt(log.data);
  } catch {
    return null;
  }
  const timestamp = latestTs - Number(tip - log.blockNumber);
  return {
    hash: log.transactionHash,
    from,
    to,
    value,
    timestamp,
    tokenSymbol: "",
    tokenDecimals: 18,
    tokenContract: getAddress(log.address),
    success: true,
  };
}

async function attachTokenMetadata(client: LogClient, transfers: NormalizedTokenTransfer[]): Promise<void> {
  const contracts = [...new Map(transfers.map((transfer) => [transfer.tokenContract.toLowerCase(), transfer.tokenContract])).values()].slice(0, 12);
  if (contracts.length === 0) return;
  const results = await client.multicall({
    allowFailure: true,
    contracts: contracts.flatMap((token) => [
      { address: token, abi: erc20Abi, functionName: "symbol" as const },
      { address: token, abi: erc20Abi, functionName: "decimals" as const },
    ]),
  });
  const meta = new Map<string, { symbol: string; decimals: number }>();
  contracts.forEach((token, index) => {
    const symbolRow = results[index * 2];
    const decimalsRow = results[index * 2 + 1];
    const symbol = symbolRow?.status === "success" && typeof symbolRow.result === "string" ? symbolRow.result : "";
    const decimalsValue = decimalsRow?.status === "success" ? decimalsRow.result : 18;
    const decimals = typeof decimalsValue === "bigint" ? Number(decimalsValue) : typeof decimalsValue === "number" ? decimalsValue : 18;
    meta.set(token.toLowerCase(), { symbol, decimals });
  });
  for (const transfer of transfers) {
    const found = meta.get(transfer.tokenContract.toLowerCase());
    if (!found) continue;
    transfer.tokenSymbol = found.symbol;
    transfer.tokenDecimals = found.decimals;
  }
}

function addressFromTopic(topic: Hex | undefined): Address | null {
  if (!topic || topic.length < 42) return null;
  try {
    return getAddress(`0x${topic.slice(-40)}`);
  } catch {
    return null;
  }
}

function dedupe(rows: NormalizedTokenTransfer[]): NormalizedTokenTransfer[] {
  const seen = new Set<string>();
  const out: NormalizedTokenTransfer[] = [];
  for (const row of rows) {
    const key = `${row.hash}:${row.tokenContract}:${row.from}:${row.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function defaultClient(): LogClient {
  const client = createPublicClient({
    chain: celo,
    transport: http(rpcUrl(), { timeout: 8_000, retryCount: 0 }),
  });
  return client as unknown as LogClient;
}
