import { createPublicClient, getAddress, http, isAddress, type Address, type Hex, type PublicClient } from "viem";
import { celo } from "viem/chains";
import { identityAbi } from "@/lib/abi/identity";
import { keystoreAbi } from "@/lib/abi/keystore";
import {
  CELO_CHAIN_ID,
  IDENTITY_REGISTRY,
  KEYSTORE,
  MAX_IDENTITY_IDS,
  MAX_KEYS,
  rpcUrl,
} from "@/lib/config";

export type IdentityOnChain = {
  tokenId: bigint;
  owner: Address | null;
  agentWallet: Address | null;
  tokenUri: string | null;
};

export type KeyOnChain = {
  keyId: Hex;
  valid: boolean;
  root: boolean;
  expiry: bigint;
  metadata: Hex;
};

export interface ChainReader {
  getIdentityBalance(address: Address): Promise<bigint>;
  readIdentities(tokenIds: bigint[]): Promise<{ records: IdentityOnChain[]; truncated: boolean }>;
  readKeys(address: Address): Promise<{ keys: KeyOnChain[]; truncated: boolean }>;
}

type CeloClient = PublicClient<ReturnType<typeof http>, typeof celo>;

/**
 * Read-only Celo client. No wallet, no account, no send.
 */
export function createCeloReader(url = rpcUrl()): ChainReader {
  const client = createPublicClient({
    chain: celo,
    transport: http(url, { timeout: 12_000, retryCount: 1 }),
  });
  return new ViemChainReader(client);
}

class ViemChainReader implements ChainReader {
  private chainReady: Promise<void> | null = null;

  constructor(private readonly client: CeloClient) {}

  async getIdentityBalance(address: Address): Promise<bigint> {
    await this.assertChain();
    const balance = toBigInt(
      await this.client.readContract({
        address: IDENTITY_REGISTRY,
        abi: identityAbi,
        functionName: "balanceOf",
        args: [address],
      }),
    );
    if (balance === null) throw new Error("Identity balance was not a number.");
    return balance;
  }

  async readIdentities(tokenIds: bigint[]): Promise<{ records: IdentityOnChain[]; truncated: boolean }> {
    await this.assertChain();
    const unique = [...new Set(tokenIds.map((id) => id.toString()))].map((id) => BigInt(id));
    const truncated = unique.length > MAX_IDENTITY_IDS;
    const selected = truncated ? unique.slice(0, MAX_IDENTITY_IDS) : unique;
    if (selected.length === 0) return { records: [], truncated: false };

    const results = await this.client.multicall({
      allowFailure: true,
      contracts: selected.flatMap((tokenId) => [
        {
          address: IDENTITY_REGISTRY,
          abi: identityAbi,
          functionName: "ownerOf" as const,
          args: [tokenId] as const,
        },
        {
          address: IDENTITY_REGISTRY,
          abi: identityAbi,
          functionName: "getAgentWallet" as const,
          args: [tokenId] as const,
        },
        {
          address: IDENTITY_REGISTRY,
          abi: identityAbi,
          functionName: "tokenURI" as const,
          args: [tokenId] as const,
        },
      ]),
    });

    const records = selected.map((tokenId, index) => {
      const owner = results[index * 3];
      const wallet = results[index * 3 + 1];
      const uri = results[index * 3 + 2];
      return {
        tokenId,
        owner: addressAt(owner),
        agentWallet: addressAt(wallet),
        tokenUri: uri?.status === "success" && typeof uri.result === "string" ? uri.result : null,
      };
    });
    return { records, truncated };
  }

  async readKeys(address: Address): Promise<{ keys: KeyOnChain[]; truncated: boolean }> {
    await this.assertChain();
    const listed = await this.client.readContract({
      address: KEYSTORE,
      abi: keystoreAbi,
      functionName: "getKeys",
      args: [address],
    });
    const truncated = listed.length > MAX_KEYS;
    const keyIds = truncated ? listed.slice(0, MAX_KEYS) : listed;
    if (keyIds.length === 0) return { keys: [], truncated: false };

    const results = await this.client.multicall({
      allowFailure: true,
      contracts: keyIds.flatMap((keyId) => [
        {
          address: KEYSTORE,
          abi: keystoreAbi,
          functionName: "isValidKey" as const,
          args: [address, keyId] as const,
        },
        {
          address: KEYSTORE,
          abi: keystoreAbi,
          functionName: "isRootKey" as const,
          args: [address, keyId] as const,
        },
        {
          address: KEYSTORE,
          abi: keystoreAbi,
          functionName: "getExpiry" as const,
          args: [address, keyId] as const,
        },
        {
          address: KEYSTORE,
          abi: keystoreAbi,
          functionName: "getMetadata" as const,
          args: [address, keyId] as const,
        },
      ]),
    });

    const keys = keyIds.map((keyId, index) => {
      const valid = boolAt(results[index * 4]);
      const root = boolAt(results[index * 4 + 1]);
      const expiry = bigintAt(results[index * 4 + 2]);
      const metadata = hexAt(results[index * 4 + 3]);
      if (valid === null || root === null || expiry === null || metadata === null) {
        throw new Error("A keystore read failed for a listed key.");
      }
      return { keyId, valid, root, expiry, metadata };
    });
    return { keys, truncated };
  }

  private assertChain(): Promise<void> {
    this.chainReady ??= this.client.getChainId().then((id) => {
      if (id !== CELO_CHAIN_ID) {
        throw new Error(
          `RPC chain id is ${id}. Preflight only reads Celo mainnet (${CELO_CHAIN_ID}).`,
        );
      }
    });
    return this.chainReady;
  }
}

function addressAt(row: { status: string; result?: unknown } | undefined): Address | null {
  if (!row || row.status !== "success" || typeof row.result !== "string" || !isAddress(row.result, { strict: false })) {
    return null;
  }
  return getAddress(row.result);
}

function boolAt(row: { status: string; result?: unknown } | undefined): boolean | null {
  if (!row || row.status !== "success" || typeof row.result !== "boolean") return null;
  return row.result;
}

function bigintAt(row: { status: string; result?: unknown } | undefined): bigint | null {
  if (!row || row.status !== "success") return null;
  return toBigInt(row.result);
}

function toBigInt(value: unknown): bigint | null {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isInteger(value)) return BigInt(value);
  if (typeof value === "string" && /^-?\d+$/.test(value)) return BigInt(value);
  return null;
}

function hexAt(row: { status: string; result?: unknown } | undefined): Hex | null {
  if (!row || row.status !== "success" || typeof row.result !== "string") return null;
  if (!row.result.startsWith("0x")) return null;
  return row.result as Hex;
}
