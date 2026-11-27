import type { Address, Hex } from "viem";
import type { AccountActivity, NormalizedTokenTransfer, NormalizedTx } from "@/lib/activity/types";
import { PAYMENT_WINDOW_DAYS, windowStart } from "@/lib/config";
import { formatAmount, sameAddress } from "@/lib/format";
import type { FundingLink, PaymentAsset, PaymentsCheck } from "@/lib/types";

const NO_LINK = "No funding link found.";
const LINK_FOUND =
  "Funding link found. A payer also received funds from the agent or the identity owner in this window.";

export function interpretPayments(input: {
  address: Address;
  owners: Address[];
  activity: AccountActivity;
  nowUnix: number;
  readFailed: boolean;
  ownerHistoryIncomplete: boolean;
  distinctAgentWallet: Address | null;
}): PaymentsCheck {
  if (input.readFailed) {
    return {
      id: "payments",
      title: "Has anyone real paid it",
      status: "Unread",
      summary: "Payment history could not be read from the activity source.",
      windowDays: PAYMENT_WINDOW_DAYS,
      incomingCount: 0,
      distinctPayers: 0,
      payers: [],
      assets: [],
      fundingLink: "",
      fundingLinks: [],
      historyComplete: false,
    };
  }

  const since = windowStart(input.nowUnix);
  const funders = uniqueAddresses([input.address, ...input.owners]);
  const nativeIn = incomingNative(input.activity.transactions, input.address, since);
  const internalIn = input.activity.internalRead
    ? incomingNative(input.activity.internalTransactions, input.address, since)
    : [];
  const tokensIn = incomingTokens(input.activity.tokenTransfers, input.address, since);
  const payers = uniqueAddresses([
    ...nativeIn.map((tx) => tx.from),
    ...internalIn.map((tx) => tx.from),
    ...tokensIn.map((tx) => tx.from),
  ]);

  const fundingLinks = collectFundingLinks({
    activity: input.activity,
    payers,
    funders,
    agent: input.address,
    since,
  });

  const tokenRead = input.activity.tokenRead !== false;
  const nativeRead = input.activity.nativeRead !== false;
  const historyComplete =
    !input.activity.truncated &&
    input.activity.internalRead &&
    tokenRead &&
    nativeRead &&
    !input.ownerHistoryIncomplete;
  const incomingCount = nativeIn.length + internalIn.length + tokensIn.length;
  const assets = summarizeAssets(nativeIn, internalIn, tokensIn);
  const fundingLink = fundingSentence(fundingLinks.length > 0, historyComplete);

  const parts = [
    incomingCount === 0
      ? `No incoming payments in the last ${PAYMENT_WINDOW_DAYS} days.`
      : `${incomingCount} incoming payment${incomingCount === 1 ? "" : "s"} in the last ${PAYMENT_WINDOW_DAYS} days from ${payers.length} distinct payer${payers.length === 1 ? "" : "s"}.`,
    fundingLink,
  ];
  if (input.distinctAgentWallet) {
    parts.push(
      `The registered agent wallet is ${input.distinctAgentWallet}, which is not this address. Payments here are only for the address you entered.`,
    );
  }
  if (!nativeRead) {
    parts.push(`Native transfers could not be read. ${input.activity.nativeError ?? ""}`.trim());
  }
  if (!tokenRead) {
    parts.push(`ERC-20 transfers could not be read. ${input.activity.tokenError ?? ""}`.trim());
  }
  if (!input.activity.internalRead) {
    parts.push(`Internal CELO transfers could not be read. ${input.activity.internalError ?? ""}`.trim());
  }
  if (input.activity.truncated || input.ownerHistoryIncomplete) {
    parts.push("History is capped or an owner history read failed, so earlier transfers in the window may be missing.");
  }

  return {
    id: "payments",
    title: "Has anyone real paid it",
    status: incomingCount === 0 ? "Not found" : "Live",
    summary: parts.join(" "),
    windowDays: PAYMENT_WINDOW_DAYS,
    incomingCount,
    distinctPayers: payers.length,
    payers,
    assets,
    fundingLink,
    fundingLinks: fundingLinks.slice(0, 20),
    historyComplete,
  };
}

export function fundingSentence(found: boolean, historyComplete: boolean): string {
  if (found) return LINK_FOUND;
  if (!historyComplete) {
    return "No funding link found in the transfers that were read. The history is incomplete, so this is not the full window.";
  }
  return NO_LINK;
}

function incomingNative(txs: NormalizedTx[], agent: Address, since: number): NormalizedTx[] {
  return txs.filter(
    (tx) =>
      tx.success &&
      tx.value > 0n &&
      tx.timestamp >= since &&
      sameAddress(tx.to, agent) &&
      !sameAddress(tx.from, agent),
  );
}

function incomingTokens(
  transfers: NormalizedTokenTransfer[],
  agent: Address,
  since: number,
): NormalizedTokenTransfer[] {
  return transfers.filter(
    (tx) =>
      tx.success &&
      tx.value > 0n &&
      tx.timestamp >= since &&
      sameAddress(tx.to, agent) &&
      !sameAddress(tx.from, agent),
  );
}

function collectFundingLinks(input: {
  activity: AccountActivity;
  payers: Address[];
  funders: Address[];
  agent: Address;
  since: number;
}): FundingLink[] {
  const payerSet = new Set(input.payers.map((payer) => payer.toLowerCase()));
  const links: FundingLink[] = [];

  const consider = (from: Address, to: Address | null, value: bigint, hash: Hex, asset: string, timestamp: number, success: boolean) => {
    if (!success || value <= 0n || timestamp < input.since || !to) return;
    if (!payerSet.has(to.toLowerCase())) return;
    const funder = input.funders.find((candidate) => sameAddress(candidate, from));
    if (!funder) return;
    links.push({
      payer: to,
      funder,
      funderRole: sameAddress(funder, input.agent) ? "Agent" : "Owner",
      asset,
      transactionHash: hash,
    });
  };

  for (const tx of input.activity.transactions) {
    consider(tx.from, tx.to, tx.value, tx.hash, "CELO", tx.timestamp, tx.success);
  }
  for (const tx of input.activity.internalTransactions) {
    consider(tx.from, tx.to, tx.value, tx.hash, "CELO", tx.timestamp, tx.success);
  }
  for (const tx of input.activity.tokenTransfers) {
    const asset = tx.tokenSymbol || tx.tokenContract;
    consider(tx.from, tx.to, tx.value, tx.hash, asset, tx.timestamp, tx.success);
  }
  return links;
}

function summarizeAssets(
  nativeIn: NormalizedTx[],
  internalIn: NormalizedTx[],
  tokensIn: NormalizedTokenTransfer[],
): PaymentAsset[] {
  const celoCount = nativeIn.length + internalIn.length;
  const celoAmount = [...nativeIn, ...internalIn].reduce((sum, tx) => sum + tx.value, 0n);
  const assets: PaymentAsset[] = [];
  if (celoCount > 0) {
    assets.push({
      asset: "CELO",
      paymentCount: celoCount,
      amount: formatAmount(celoAmount, 18),
    });
  }

  const groups = new Map<string, { symbol: string; contract: Address; count: number; amount: bigint; decimals: number }>();
  for (const tx of tokensIn) {
    const current = groups.get(tx.tokenContract.toLowerCase());
    if (current) {
      current.count += 1;
      current.amount += tx.value;
      continue;
    }
    groups.set(tx.tokenContract.toLowerCase(), {
      symbol: tx.tokenSymbol,
      contract: tx.tokenContract,
      count: 1,
      amount: tx.value,
      decimals: tx.tokenDecimals,
    });
  }
  for (const group of groups.values()) {
    const label = group.symbol
      ? `${group.symbol} (${group.contract.slice(0, 6)}...${group.contract.slice(-4)})`
      : group.contract;
    assets.push({
      asset: label,
      paymentCount: group.count,
      amount: formatAmount(group.amount, group.decimals),
    });
  }
  return assets;
}

function uniqueAddresses(addresses: Address[]): Address[] {
  const seen = new Set<string>();
  const out: Address[] = [];
  for (const address of addresses) {
    const key = address.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(address);
  }
  return out;
}
