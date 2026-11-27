import { getAddress, isAddress, zeroAddress, type Address } from "viem";
import type { AccountActivity } from "@/lib/activity/types";
import { createActivitySource } from "@/lib/activity/source";
import { createCeloReader, type ChainReader, type IdentityOnChain } from "@/lib/chain/reader";
import { interpretAttribution } from "@/lib/checks/attribution";
import { interpretIdentity } from "@/lib/checks/identity";
import { interpretKeystore } from "@/lib/checks/keystore";
import { interpretPayments } from "@/lib/checks/payments";
import { readAgentName } from "@/lib/checks/registration";
import { decideVerdict } from "@/lib/checks/verdict";
import {
  CELO_CHAIN_ID,
  hackathonModeEnabled,
  IDENTITY_REGISTRY,
  IDENTITY_REGISTRY_DOCS,
  KEYSTORE,
  MAX_OWNERS_TO_SCAN,
  windowStart,
} from "@/lib/config";
import { sameAddress } from "@/lib/format";
import type { ActivitySource } from "@/lib/activity/types";
import type { Check, Report } from "@/lib/types";
import { x402ReportNote } from "@/lib/x402";

export type CheckDeps = {
  chain: ChainReader;
  activity: ActivitySource;
  now: () => Date;
  hackathonMode: boolean;
  readName: (uri: string) => Promise<string | null>;
};

export function defaultDeps(): CheckDeps {
  return {
    chain: createCeloReader(),
    activity: createActivitySource(),
    now: () => new Date(),
    hackathonMode: hackathonModeEnabled(),
    readName: readAgentName,
  };
}

export async function loadReport(
  raw: string,
  deps: CheckDeps = defaultDeps(),
): Promise<{ ok: true; report: Report } | { ok: false; error: string }> {
  const trimmed = raw.trim();
  if (!isAddress(trimmed, { strict: false })) {
    return { ok: false, error: "Enter a Celo address, 0x followed by 40 hex characters." };
  }
  const address = getAddress(trimmed);
  const now = deps.now();
  const nowUnix = Math.floor(now.getTime() / 1000);
  const since = windowStart(nowUnix);

  const [balanceResult, keysResult, activityResult, tokenIdResult] = await Promise.allSettled([
    deps.chain.getIdentityBalance(address),
    deps.chain.readKeys(address),
    deps.activity.getAccountActivity(address, since),
    deps.activity.getIdentityTokenIds(address, IDENTITY_REGISTRY),
  ]);

  const balance = balanceResult.status === "fulfilled" ? balanceResult.value : null;
  const tokenIds = tokenIdResult.status === "fulfilled" ? tokenIdResult.value.tokenIds : [];
  const tokenHistoryTruncated = tokenIdResult.status === "fulfilled" ? tokenIdResult.value.truncated : false;
  const tokenHistoryFailed = tokenIdResult.status === "rejected";

  let identityRecords: IdentityOnChain[] = [];
  let identityRecordsTruncated = false;
  let identityRecordReadFailed = false;
  if (tokenIds.length > 0 && tokenIdResult.status === "fulfilled") {
    try {
      const read = await deps.chain.readIdentities(tokenIds);
      identityRecords = read.records;
      identityRecordsTruncated = read.truncated;
    } catch {
      identityRecordReadFailed = true;
    }
  }

  const names = new Map<string, string | null>();
  const nameTargets = identityRecords.filter(
    (record) =>
      record.tokenUri &&
      record.owner &&
      record.agentWallet &&
      (sameAddress(record.owner, address) || sameAddress(record.agentWallet, address)),
  );
  await Promise.all(
    nameTargets.slice(0, 10).map(async (record) => {
      const name = record.tokenUri ? await deps.readName(record.tokenUri) : null;
      names.set(record.tokenId.toString(), name);
    }),
  );

  const identity = interpretIdentity({
    address,
    balance,
    records: identityRecords,
    names,
    historyTruncated: tokenHistoryTruncated || identityRecordsTruncated,
    readFailed: balanceResult.status === "rejected" || tokenHistoryFailed || identityRecordReadFailed,
  });

  const keystore = interpretKeystore({
    keys: keysResult.status === "fulfilled" ? keysResult.value.keys : [],
    truncated: keysResult.status === "fulfilled" ? keysResult.value.truncated : false,
    nowUnix,
    readFailed: keysResult.status === "rejected",
  });

  const selfActivity = activityResult.status === "fulfilled" ? activityResult.value : null;
  const owners = ownerAddresses(address, identityRecords);
  const ownersToScan = owners.slice(0, MAX_OWNERS_TO_SCAN);
  const ownerHistoryIncomplete = owners.length > MAX_OWNERS_TO_SCAN;
  const ownerActivities: AccountActivity[] = [];
  if (selfActivity && ownersToScan.length > 0) {
    const ownerResults = await Promise.allSettled(
      ownersToScan.map((owner) => deps.activity.getAccountActivity(owner, since)),
    );
    for (const result of ownerResults) {
      if (result.status === "fulfilled") ownerActivities.push(result.value);
    }
    if (ownerResults.some((result) => result.status === "rejected")) {
      // Marked below by comparing lengths.
    }
  }
  const ownerReadsFailed = selfActivity !== null && ownerActivities.length !== ownersToScan.length;

  const merged = selfActivity
    ? mergeActivity(selfActivity, ownerActivities, ownerHistoryIncomplete || ownerReadsFailed)
    : null;

  const payments = interpretPayments({
    address,
    owners: ownersToScan,
    activity: merged ?? emptyActivity(),
    nowUnix,
    readFailed: selfActivity === null,
    ownerHistoryIncomplete: ownerHistoryIncomplete || ownerReadsFailed,
    distinctAgentWallet: distinctWallet(address, identityRecords),
  });

  const checks: Check[] = [identity, keystore, payments];
  if (deps.hackathonMode) {
    checks.push(
      interpretAttribution({
        address,
        transactions: selfActivity?.transactions ?? [],
        nowUnix,
        readFailed: selfActivity === null,
      }),
    );
  }

  const decision = decideVerdict({
    identityStatus: identity.status,
    keystoreStatus: keystore.status,
    paymentsStatus: payments.status,
    distinctPayers: payments.distinctPayers,
    fundingLinkFound: payments.fundingLinks.length > 0,
    historyComplete: payments.historyComplete,
  });

  return {
    ok: true,
    report: {
      address,
      chainId: CELO_CHAIN_ID,
      verdict: decision.verdict,
      reason: decision.reason,
      checks,
      hackathonMode: deps.hackathonMode,
      x402: x402ReportNote(),
      sources: {
        identityRegistry: IDENTITY_REGISTRY,
        identityRegistryDocs: IDENTITY_REGISTRY_DOCS,
        keystore: KEYSTORE,
        activity: deps.activity.label,
      },
      generatedAt: now.toISOString(),
    },
  };
}

function ownerAddresses(agent: Address, records: IdentityOnChain[]): Address[] {
  const owners: Address[] = [];
  for (const record of records) {
    if (!record.owner || !record.agentWallet) continue;
    const matched = sameAddress(record.owner, agent) || sameAddress(record.agentWallet, agent);
    if (!matched) continue;
    if (sameAddress(record.owner, agent) || sameAddress(record.owner, zeroAddress)) continue;
    if (owners.some((owner) => sameAddress(owner, record.owner))) continue;
    owners.push(getAddress(record.owner));
  }
  return owners;
}

function distinctWallet(agent: Address, records: IdentityOnChain[]): Address | null {
  for (const record of records) {
    if (!record.agentWallet || sameAddress(record.agentWallet, zeroAddress)) continue;
    if (!sameAddress(record.owner, agent) && !sameAddress(record.agentWallet, agent)) continue;
    if (!sameAddress(record.agentWallet, agent)) return getAddress(record.agentWallet);
  }
  return null;
}

function mergeActivity(
  selfActivity: AccountActivity,
  ownerActivities: AccountActivity[],
  ownerIncomplete: boolean,
): AccountActivity {
  const parts = [selfActivity, ...ownerActivities];
  return {
    transactions: dedupeTx(parts.flatMap((item) => item.transactions)),
    tokenTransfers: dedupeTransfers(parts.flatMap((item) => item.tokenTransfers)),
    internalTransactions: dedupeTx(parts.flatMap((item) => item.internalTransactions)),
    truncated: parts.some((item) => item.truncated) || ownerIncomplete,
    internalRead: parts.every((item) => item.internalRead),
    nativeRead: parts.every((item) => item.nativeRead !== false),
    tokenRead: parts.every((item) => item.tokenRead !== false),
    nativeError: parts.find((item) => item.nativeError)?.nativeError,
    tokenError: parts.find((item) => item.tokenError)?.tokenError,
    internalError: parts.find((item) => item.internalError)?.internalError,
  };
}

function dedupeTx(rows: AccountActivity["transactions"]): AccountActivity["transactions"] {
  const seen = new Set<string>();
  const out: AccountActivity["transactions"] = [];
  for (const row of rows) {
    const key = `${row.hash}:${row.from}:${row.to ?? ""}:${row.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function dedupeTransfers(rows: AccountActivity["tokenTransfers"]): AccountActivity["tokenTransfers"] {
  const seen = new Set<string>();
  const out: AccountActivity["tokenTransfers"] = [];
  for (const row of rows) {
    const key = `${row.hash}:${row.tokenContract}:${row.from}:${row.to ?? ""}:${row.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function emptyActivity(): AccountActivity {
  return {
    transactions: [],
    tokenTransfers: [],
    internalTransactions: [],
    truncated: false,
    internalRead: true,
  };
}
