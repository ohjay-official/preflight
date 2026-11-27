import type { Address, Hex } from "viem";

export type NormalizedTx = {
  hash: Hex;
  from: Address;
  to: Address | null;
  value: bigint;
  timestamp: number;
  input: Hex;
  success: boolean;
};

export type NormalizedTokenTransfer = {
  hash: Hex;
  from: Address;
  to: Address | null;
  value: bigint;
  timestamp: number;
  tokenSymbol: string;
  tokenDecimals: number;
  tokenContract: Address;
  success: boolean;
};

export type AccountActivity = {
  transactions: NormalizedTx[];
  tokenTransfers: NormalizedTokenTransfer[];
  internalTransactions: NormalizedTx[];
  truncated: boolean;
  internalRead: boolean;
  /** False when that Blockscout list failed. Omitted means the list was read. */
  nativeRead?: boolean;
  tokenRead?: boolean;
  nativeError?: string;
  tokenError?: string;
  internalError?: string;
};

export interface ActivitySource {
  readonly label: string;
  getAccountActivity(address: Address, sinceUnix: number): Promise<AccountActivity>;
  getIdentityTokenIds(
    address: Address,
    registry: Address,
  ): Promise<{ tokenIds: bigint[]; truncated: boolean }>;
}
