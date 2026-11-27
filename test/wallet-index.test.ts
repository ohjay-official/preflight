import { encodeAbiParameters, encodeEventTopics, parseAbiItem } from "viem";
import { describe, expect, it } from "vitest";
import { blockChunks, decodeWalletLog, indexWalletLogs } from "@/lib/identity/logs";

const event = parseAbiItem(
  "event MetadataSet(uint256 indexed agentId, string indexed indexedMetadataKey, string metadataKey, bytes metadataValue)",
);

describe("agent wallet log index", () => {
  it("keeps the latest setAgentWallet and drops a later clear", () => {
    const first = walletLog(166n, "0xbfFcCa1F539455d3FF8A181f6598767d074fFA7F", 10n, 1);
    const second = walletLog(166n, "0x1111111111111111111111111111111111111111", 11n, 1);
    const cleared = walletLog(166n, null, 12n, 1);
    const other = walletLog(9n, "0x2222222222222222222222222222222222222222", 9n, 1);
    const index = indexWalletLogs([second, first, cleared, other].map((row) => decodeWalletLog(row)!));
    expect(index.get("0xbfffca1f539455d3ff8a181f6598767d074ffa7f")).toBeUndefined();
    expect(index.get("0x1111111111111111111111111111111111111111")).toBeUndefined();
    expect(index.get("0x2222222222222222222222222222222222222222")).toEqual([9n]);
  });

  it("splits a block span into inclusive chunks", () => {
    expect(blockChunks(10n, 25n, 10n)).toEqual([
      { from: 10n, to: 19n },
      { from: 20n, to: 25n },
    ]);
  });
});

function walletLog(agentId: bigint, wallet: `0x${string}` | null, blockNumber: bigint, logIndex: number) {
  const bytes = wallet ? wallet : "0x";
  const data = encodeAbiParameters(
    [
      { type: "string" },
      { type: "bytes" },
    ],
    ["agentWallet", bytes],
  );
  const topics = encodeEventTopics({
    abi: [event],
    eventName: "MetadataSet",
    args: { agentId, indexedMetadataKey: "agentWallet" },
  });
  return {
    data,
    topics: topics.map((topic) => String(topic)),
    blockNumber: `0x${blockNumber.toString(16)}`,
    logIndex: `0x${logIndex.toString(16)}`,
  };
}
