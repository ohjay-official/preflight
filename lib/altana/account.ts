import {
  encodeAbiParameters,
  getAddress,
  keccak256,
  parseAbi,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { KEY_TYPES, PERIODS } from "@/lib/altana/config";

/**
 * Reads an Altana wallet's keys from the wallet account itself: expiry, admin flag, and for
 * agent (session) keys the spend caps, today's spend and the allowlist. The KeyStore doesn't
 * hold caps (getMetadata is empty), so this is where they are. Read-only.
 * Views as used on mainnet by HexboxTools/celo-spendguard scripts/session-status.mjs; checked
 * against 34 wallets on 27 Nov 2026 (docs/test-results.md, test 1).
 */
export const altanaAccountAbi = parseAbi([
  "function getKeys() view returns ((uint40 expiry,uint8 keyType,bool isSuperAdmin,bytes publicKey)[] keys, bytes32[] keyHashes)",
  "function canExecutePackedInfos(bytes32 keyHash) view returns (bytes32[])",
  "function spendInfos(bytes32 keyHash) view returns ((address token,uint8 period,uint256 limit,uint256 spent,uint256 lastUpdated,uint256 currentSpent,uint256 current)[])",
]);

/** `0x32323232` in an allowlist entry means any function on that target. */
export const ANY_FUNCTION_SELECTOR = "0x32323232";

export type AllowedCall = { target: Address; selector: Hex; anyFunction: boolean };
export type SpendCap = { token: Address; period: string; limit: bigint; spentThisPeriod: bigint };
export type AccountKey = {
  keyHash: Hex;
  keyType: (typeof KEY_TYPES)[number] | `type ${number}`;
  isAdmin: boolean;
  /** Unix seconds; 0 means no expiry. */
  expiry: number;
  /** For a secp256k1 key the account stores its address. */
  address: Address | null;
  caps: SpendCap[];
  allowlist: AllowedCall[];
};

export function keyTypeName(n: number): AccountKey["keyType"] {
  return KEY_TYPES[n] ?? (`type ${n}` as const);
}

export function periodName(n: number): string {
  return PERIODS[n] ?? `period ${n}`;
}

export function decodeAllowlist(packed: readonly Hex[]): AllowedCall[] {
  return packed.map((p) => {
    const target = getAddress(`0x${p.slice(2, 42)}`);
    const selector = `0x${p.slice(-8)}` as Hex;
    return { target, selector, anyFunction: selector === ANY_FUNCTION_SELECTOR };
  });
}

/** Address of a 65-byte uncompressed SEC1 secp256k1 public key. */
export function addressFromPublicKey(publicKey: Hex): Address {
  const raw = publicKey.startsWith("0x04") ? `0x${publicKey.slice(4)}` : publicKey;
  return getAddress(`0x${keccak256(raw as Hex).slice(-40)}`);
}

/** The KeyStore indexes keys by keccak256(publicKey) (SDK GrantSessionResult.keyId). */
export function keyStoreKeyId(publicKey: Hex): Hex {
  return keccak256(publicKey);
}

/**
 * The account indexes a secp256k1 session by keccak256(abi.encode(2, keccak256(abi.encode(address))))
 * (SDK internal/erc1271.ts).
 */
export function accountKeyHashForAddress(address: Address): Hex {
  const inner = keccak256(encodeAbiParameters([{ type: "address" }], [address]));
  return keccak256(encodeAbiParameters([{ type: "uint256" }, { type: "bytes32" }], [2n, inner]));
}

/** Returns null when the address is not an Altana account (no code, or getKeys reverts). */
export async function readAccountKeys(client: PublicClient, wallet: Address): Promise<AccountKey[] | null> {
  let result: readonly [readonly { expiry: number; keyType: number; isSuperAdmin: boolean; publicKey: Hex }[], readonly Hex[]];
  try {
    result = await client.readContract({ address: wallet, abi: altanaAccountAbi, functionName: "getKeys" });
  } catch {
    return null;
  }
  const [keys, hashes] = result;
  return Promise.all(
    keys.map(async (k, i): Promise<AccountKey> => {
      const keyHash = hashes[i] as Hex;
      const isSecp = k.keyType === 2 && k.publicKey.length === 66;
      const base: AccountKey = {
        keyHash,
        keyType: keyTypeName(k.keyType),
        isAdmin: k.isSuperAdmin,
        expiry: Number(k.expiry),
        address: isSecp ? getAddress(`0x${k.publicKey.slice(-40)}`) : null,
        caps: [],
        allowlist: [],
      };
      if (k.isSuperAdmin) return base;
      const [packed, spends] = await Promise.all([
        client.readContract({ address: wallet, abi: altanaAccountAbi, functionName: "canExecutePackedInfos", args: [keyHash] }).catch(() => [] as readonly Hex[]),
        client.readContract({ address: wallet, abi: altanaAccountAbi, functionName: "spendInfos", args: [keyHash] }).catch(() => []),
      ]);
      base.allowlist = decodeAllowlist(packed);
      base.caps = spends.map((s) => ({
        token: getAddress(s.token),
        period: periodName(s.period),
        limit: s.limit,
        spentThisPeriod: s.currentSpent,
      }));
      return base;
    }),
  );
}
