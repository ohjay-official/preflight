import type { Address, Hex } from "viem";
import type { X402_PRICE_USD } from "@/lib/config";

export type StatusWord = "Live" | "Revoked" | "Expired" | "Not found";
export type CheckStatus = StatusWord | "Unread";
export type Verdict = "OK to pay" | "Small amounts only" | "Don't pay";

export type KeyReport = {
  keyId: Hex;
  role: "Root key" | "Agent key";
  status: StatusWord;
  expiry: string;
  metadataBytes: number;
  metadataHex: string | null;
};

export type IdentityRecord = {
  tokenId: string;
  owner: Address;
  agentWallet: Address;
  tokenUri: string | null;
  name: string | null;
  matchedAs: "Owner" | "Agent wallet";
};

export type FundingLink = {
  payer: Address;
  funder: Address;
  funderRole: "Agent" | "Owner";
  asset: string;
  transactionHash: Hex;
};

export type PaymentAsset = {
  asset: string;
  paymentCount: number;
  amount: string;
};

export type IdentityCheck = {
  id: "identity";
  title: "Who is it";
  status: CheckStatus;
  summary: string;
  balance: string | null;
  records: IdentityRecord[];
};

export type KeystoreCheck = {
  id: "keystore";
  title: "Can it be stopped";
  status: CheckStatus;
  summary: string;
  keys: KeyReport[];
  note: string;
};

export type PaymentsCheck = {
  id: "payments";
  title: "Has anyone real paid it";
  status: CheckStatus;
  summary: string;
  windowDays: number;
  incomingCount: number;
  distinctPayers: number;
  payers: Address[];
  assets: PaymentAsset[];
  fundingLink: string;
  fundingLinks: FundingLink[];
  historyComplete: boolean;
};

export type AttributionCheck = {
  id: "attribution";
  title: "Attribution tags";
  status: CheckStatus;
  summary: string;
  tagged: number;
  total: number;
  codes: string[];
  note: string;
};

export type Check = IdentityCheck | KeystoreCheck | PaymentsCheck | AttributionCheck;

export type Report = {
  address: Address;
  chainId: 42220;
  verdict: Verdict;
  reason: string;
  checks: Check[];
  hackathonMode: boolean;
  x402: {
    enabled: false;
    priceUsd: typeof X402_PRICE_USD;
    note: string;
  };
  sources: {
    identityRegistry: Address;
    identityRegistryDocs: string;
    keystore: Address;
    activity: string;
  };
  generatedAt: string;
};
