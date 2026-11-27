import { decodeEventLog, getAddress, parseAbiItem, type Address } from "viem";

/**
 * The verified IdentityRegistry emits MetadataSet for setAgentWallet.
 * There is no separate AgentWalletSet event in that ABI.
 * Indexed string "agentWallet" is the second topic.
 */
export const metadataSetEvent = parseAbiItem(
  "event MetadataSet(uint256 indexed agentId, string indexed indexedMetadataKey, string metadataKey, bytes metadataValue)",
);

export type WalletLog = {
  agentId: bigint;
  wallet: Address | null;
  blockNumber: bigint;
  logIndex: number;
};

export type RawExplorerLog = {
  data?: string;
  topics?: (string | null)[];
  blockNumber?: string;
  logIndex?: string;
};

export function blockChunks(start: bigint, end: bigint, size: bigint): Array<{ from: bigint; to: bigint }> {
  if (size <= 0n || end < start) return [];
  const chunks: Array<{ from: bigint; to: bigint }> = [];
  for (let from = start; from <= end; from += size) {
    const to = from + size - 1n > end ? end : from + size - 1n;
    chunks.push({ from, to });
  }
  return chunks;
}

export function decodeWalletLog(log: RawExplorerLog): WalletLog | null {
  const topics = (log.topics ?? []).filter((topic): topic is string => Boolean(topic));
  if (!log.data || topics.length < 3 || !log.blockNumber) return null;
  try {
    const decoded = decodeEventLog({
      abi: [metadataSetEvent],
      data: log.data as `0x${string}`,
      topics: topics as [`0x${string}`, ...`0x${string}`[]],
    });
    if (decoded.eventName !== "MetadataSet") return null;
    if (decoded.args.metadataKey !== "agentWallet") return null;
    return {
      agentId: decoded.args.agentId,
      wallet: walletFromBytes(decoded.args.metadataValue),
      blockNumber: parseHexOrDecimal(log.blockNumber),
      logIndex: log.logIndex ? Number(parseHexOrDecimal(log.logIndex)) : 0,
    };
  } catch {
    return null;
  }
}

/**
 * Latest setAgentWallet wins. An empty value or the zero address clears the wallet.
 * Returns lowercase address to agent ids that currently point at it.
 */
export function indexWalletLogs(logs: WalletLog[]): Map<string, bigint[]> {
  const ordered = [...logs].sort((left, right) => {
    if (left.blockNumber !== right.blockNumber) return left.blockNumber < right.blockNumber ? -1 : 1;
    return left.logIndex - right.logIndex;
  });
  const latest = new Map<string, Address | null>();
  for (const log of ordered) {
    latest.set(log.agentId.toString(), log.wallet);
  }
  const byWallet = new Map<string, bigint[]>();
  for (const [id, wallet] of latest) {
    if (!wallet) continue;
    const key = wallet.toLowerCase();
    const list = byWallet.get(key) ?? [];
    list.push(BigInt(id));
    byWallet.set(key, list);
  }
  return byWallet;
}

function walletFromBytes(value: string | undefined): Address | null {
  if (!value || value === "0x") return null;
  const hex = value.slice(2);
  if (hex.length < 40) return null;
  const address = getAddress(`0x${hex.slice(0, 40)}`);
  if (address === "0x0000000000000000000000000000000000000000") return null;
  return address;
}

function parseHexOrDecimal(value: string): bigint {
  return value.startsWith("0x") ? BigInt(value) : BigInt(value);
}
