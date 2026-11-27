import type { Address, Hex } from "viem";
import type { StatusWord } from "@/lib/types";

/**
 * Extension point for Preflight's own Altana session-key agent.
 * Not implemented. The check engine already reads any address on the Keystore.
 * This interface is only for the app's own session, which does not exist yet.
 * Do not put a private key in the implementation.
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
  implemented: false as const,
  note: "Not implemented. See docs/ARCHITECTURE.md.",
};
