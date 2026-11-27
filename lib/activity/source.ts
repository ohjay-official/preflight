import { BlockscoutActivitySource } from "@/lib/activity/blockscout";
import type { AccountActivity, ActivitySource } from "@/lib/activity/types";
import { blockscoutApiUrl } from "@/lib/config";

/**
 * TODO: Chainstack archive RPC via x402 is not implemented.
 * The class exists so a paid source can replace Blockscout without changing checks.
 * It throws on use. It does not send a transaction and does not hold a key.
 */
export class ChainstackArchiveSource implements ActivitySource {
  readonly label = "Chainstack";

  async getAccountActivity(): Promise<AccountActivity> {
    throw new Error("TODO: Chainstack archive RPC via x402 is not implemented.");
  }

  async getIdentityTokenIds(): Promise<{ tokenIds: bigint[]; truncated: boolean }> {
    throw new Error("TODO: Chainstack archive RPC via x402 is not implemented.");
  }
}

export function createActivitySource(kind = process.env.ACTIVITY_SOURCE ?? "blockscout"): ActivitySource {
  if (kind === "chainstack") return new ChainstackArchiveSource();
  if (kind === "blockscout" || kind === "") return new BlockscoutActivitySource(blockscoutApiUrl());
  throw new Error(`Unknown activity source "${kind}". Use blockscout or chainstack.`);
}
