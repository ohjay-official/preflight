import type { Address, Hex } from "viem";
import type { StatusWord } from "@/lib/types";

/**
 * Extension point for Preflight's own Altana session-key agent.
 * Implemented by `altanaSessionAgent` in lib/altana/session-agent.ts. It reads status only;
 * the session key itself is set by the owner in Vercel env and never appears in code.
 * The check engine already reads any address on the Keystore.
 */
export type SessionKeyStatus = {
  account: Address;
  keyId: Hex;
  status: StatusWord;
  expiry: string;
};

export interface SessionKeyAgent {
  readStatus(): Promise<SessionKeyStatus>;
}

export const SESSION_KEY_AGENT = {
  implemented: true as const,
  note: "lib/altana/session-agent.ts. See docs/ARCHITECTURE.md, Altana side.",
};
