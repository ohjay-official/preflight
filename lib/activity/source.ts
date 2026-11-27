import { BlockscoutActivitySource } from "@/lib/activity/blockscout";
import type { ActivitySource } from "@/lib/activity/types";
import { blockscoutApiUrl } from "@/lib/config";
import { createPaidActivitySource } from "@/lib/extensions/paid-activity";

export function createActivitySource(kind = process.env.ACTIVITY_SOURCE ?? "blockscout"): ActivitySource {
  if (kind === "chainstack" || kind === "paid") return createPaidActivitySource();
  if (kind === "blockscout" || kind === "") return new BlockscoutActivitySource(blockscoutApiUrl());
  throw new Error(`Unknown activity source "${kind}". Use blockscout or paid.`);
}
