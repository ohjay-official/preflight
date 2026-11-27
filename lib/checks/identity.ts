import { getAddress, zeroAddress, type Address } from "viem";
import type { IdentityOnChain } from "@/lib/chain/reader";
import { sameAddress } from "@/lib/format";
import type { IdentityCheck, IdentityRecord } from "@/lib/types";

const ZERO = zeroAddress;

export function interpretIdentity(input: {
  address: Address;
  balance: bigint | null;
  records: IdentityOnChain[];
  names: ReadonlyMap<string, string | null>;
  historyTruncated: boolean;
  readFailed: boolean;
  walletIndexIncomplete?: boolean;
}): IdentityCheck {
  const matched: IdentityRecord[] = [];
  for (const record of input.records) {
    if (!record.owner || !record.agentWallet) continue;
    const ownerMatch = sameAddress(record.owner, input.address);
    const walletMatch = sameAddress(record.agentWallet, input.address) && !sameAddress(record.agentWallet, ZERO);
    if (!ownerMatch && !walletMatch) continue;
    matched.push({
      tokenId: record.tokenId.toString(),
      owner: getAddress(record.owner),
      agentWallet: getAddress(record.agentWallet),
      tokenUri: record.tokenUri,
      name: input.names.get(record.tokenId.toString()) ?? null,
      matchedAs: ownerMatch ? "Owner" : "Agent wallet",
    });
  }

  const balance = input.balance;
  const ownsNft = balance !== null && balance > 0n;

  const indexIncomplete = input.walletIndexIncomplete === true;
  if (!ownsNft && matched.length === 0 && (input.readFailed || indexIncomplete || (input.historyTruncated && balance === null))) {
    return {
      id: "identity",
      title: "Who is it",
      status: "Unread",
      summary:
        indexIncomplete && balance === 0n
          ? "The agent wallet log index could not be finished, and this address does not own an identity NFT, so a setAgentWallet match may be missing."
          : "The identity registry could not be fully read, so this report cannot confirm the address.",
      balance: balance === null ? null : balance.toString(),
      records: [],
    };
  }

  if (!ownsNft && matched.length === 0) {
    return {
      id: "identity",
      title: "Who is it",
      status: "Not found",
      summary:
        "No ERC-8004 identity NFT is owned by this address, and the agent wallet log index has no current setAgentWallet for it.",
      balance: balance === null ? null : balance.toString(),
      records: [],
    };
  }

  const nameList = matched
    .map((record) => record.name)
    .filter((name): name is string => Boolean(name));
  const nameSentence = nameList.length > 0 ? ` Name: ${nameList.join(", ")}.` : "";
  const idSentence =
    matched.length > 0
      ? ` Matching agent id${matched.length === 1 ? "" : "s"}: ${matched.map((record) => record.tokenId).join(", ")}.`
      : input.records.length > 0
        ? " Transfer history did not include a token id still tied to this address."
        : " Transfer history did not return token ids, so the registration file was not read.";
  const balanceSentence =
    balance === null ? "" : ` Identity NFTs owned by this address: ${balance.toString()}.`;

  return {
    id: "identity",
    title: "Who is it",
    status: "Live",
    summary: `Registered on the ERC-8004 identity registry.${balanceSentence}${idSentence}${nameSentence}`,
    balance: balance === null ? null : balance.toString(),
    records: matched,
  };
}
