import type { KeyOnChain } from "@/lib/chain/reader";
import { expiryLabel } from "@/lib/format";
import type { KeyReport, KeystoreCheck, StatusWord } from "@/lib/types";

const NOTE =
  "getKeys returns active key ids. The verified contract drops a revoked key from that list, and it does not let the root key or the last live key be revoked. An empty list means no key was registered. Expiry 0 means no expiry. This report does not show spending caps. Metadata is raw bytes from getMetadata.";

export function interpretKeystore(input: {
  keys: KeyOnChain[];
  truncated: boolean;
  nowUnix: number;
  readFailed: boolean;
}): KeystoreCheck {
  if (input.readFailed) {
    return {
      id: "keystore",
      title: "Can it be stopped",
      status: "Unread",
      summary: "The Altana Keystore could not be read.",
      keys: [],
      note: NOTE,
    };
  }

  const keys = input.keys.map((key) => toReport(key, input.nowUnix));
  const status = overallStatus(keys.map((key) => key.status));
  const live = keys.filter((key) => key.status === "Live").length;
  const expired = keys.filter((key) => key.status === "Expired").length;
  const revoked = keys.filter((key) => key.status === "Revoked").length;
  const roots = keys.filter((key) => key.role === "Root key" && key.status === "Live").length;
  const cap = input.truncated ? " The key list was capped." : "";

  let summary: string;
  if (status === "Not found") {
    summary =
      "No keys are registered for this address on the Altana Keystore. A bootstrapped account keeps a root key on this contract, so an empty getKeys result means no key was registered.";
  } else if (status === "Live") {
    const resting = expired + revoked > 0 ? ` ${expired} expired and ${revoked} revoked are also listed.` : "";
    summary = `${live} live key${live === 1 ? "" : "s"}${roots > 0 ? ", including a live root key" : ""}.${resting} A non-root key can be revoked while a root key remains. The root key itself cannot be revoked on this contract.${cap}`;
  } else if (status === "Expired") {
    summary = `No live key. ${expired} expired, ${revoked} revoked.${cap}`;
  } else {
    summary = `No live key. isValidKey is false and the expiry has not passed, so this report marks ${revoked} key${revoked === 1 ? "" : "s"} revoked.${cap}`;
  }

  return {
    id: "keystore",
    title: "Can it be stopped",
    status,
    summary,
    keys,
    note: NOTE,
  };
}

function toReport(key: KeyOnChain, nowUnix: number): KeyReport {
  const bytes = key.metadata === "0x" ? 0 : Math.floor((key.metadata.length - 2) / 2);
  const metadataHex = bytes === 0 ? null : key.metadata.length > 130 ? `${key.metadata.slice(0, 130)}...` : key.metadata;
  return {
    keyId: key.keyId,
    role: key.root ? "Root key" : "Agent key",
    status: keyStatus(key, nowUnix),
    expiry: expiryLabel(key.expiry),
    metadataBytes: bytes,
    metadataHex,
  };
}

export function keyStatus(key: Pick<KeyOnChain, "valid" | "expiry">, nowUnix: number): StatusWord {
  if (key.valid) return "Live";
  if (key.expiry !== 0n && nowUnix > Number(key.expiry)) return "Expired";
  return "Revoked";
}

function overallStatus(statuses: StatusWord[]): StatusWord {
  if (statuses.length === 0) return "Not found";
  if (statuses.includes("Live")) return "Live";
  if (statuses.includes("Expired")) return "Expired";
  return "Revoked";
}
