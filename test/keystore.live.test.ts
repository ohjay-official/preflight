import { createPublicClient, http, zeroHash } from "viem";
import { celo } from "viem/chains";
import { describe, expect, it } from "vitest";
import { keystoreAbi } from "@/lib/abi/keystore";
import { DEFAULT_CELO_RPC_URL, KEYSTORE } from "@/lib/config";

/**
 * Optional read of the verified Keystore on Celo mainnet.
 * Run with: RUN_LIVE_TESTS=1 npm run test:live
 * This test only calls view functions. It does not sign or send.
 */
const enabled = process.env.RUN_LIVE_TESTS === "1";

const creator = "0x90052C7827475fCAb79089B81ea928A9Fa19BE7C" as const;

describe.skipIf(!enabled)("Altana Keystore live read", () => {
  it("reads VERSION, getKeys, isValidKey, isRootKey, getExpiry, and getMetadata", async () => {
    const client = createPublicClient({
      chain: celo,
      transport: http(process.env.CELO_RPC_URL || DEFAULT_CELO_RPC_URL, { timeout: 20_000 }),
    });
    const version = await client.readContract({
      address: KEYSTORE,
      abi: keystoreAbi,
      functionName: "VERSION",
    });
    expect(version).toBe("1.0.1");

    const keys = await client.readContract({
      address: KEYSTORE,
      abi: keystoreAbi,
      functionName: "getKeys",
      args: [creator],
    });
    expect(Array.isArray(keys)).toBe(true);
    const keyId = keys[0] ?? zeroHash;

    const [valid, root, expiry, metadata] = await Promise.all([
      client.readContract({
        address: KEYSTORE,
        abi: keystoreAbi,
        functionName: "isValidKey",
        args: [creator, keyId],
      }),
      client.readContract({
        address: KEYSTORE,
        abi: keystoreAbi,
        functionName: "isRootKey",
        args: [creator, keyId],
      }),
      client.readContract({
        address: KEYSTORE,
        abi: keystoreAbi,
        functionName: "getExpiry",
        args: [creator, keyId],
      }),
      client.readContract({
        address: KEYSTORE,
        abi: keystoreAbi,
        functionName: "getMetadata",
        args: [creator, keyId],
      }),
    ]);

    expect(typeof valid).toBe("boolean");
    expect(typeof root).toBe("boolean");
    expect(typeof expiry === "bigint" || typeof expiry === "number").toBe(true);
    expect(metadata.startsWith("0x")).toBe(true);
  }, 30_000);
});
