import { expiryLabel } from "@/lib/format";
import { readAgentState } from "@/lib/altana/agent";
import type { SessionKeyAgent, SessionKeyStatus } from "@/lib/extensions/session-agent";

/**
 * Preflight's own Altana session key, as the SessionKeyAgent extension point describes it.
 * Read-only: wallet account plus KeyStore, through readAgentState.
 */
export const altanaSessionAgent: SessionKeyAgent = {
  async readStatus(): Promise<SessionKeyStatus> {
    const state = await readAgentState();
    if (!state.configured) throw new Error(state.reason);
    return {
      account: state.wallet,
      keyId: state.keyStore.keyId,
      status: state.status,
      expiry: expiryLabel(BigInt(state.expiry)),
    };
  },
};
