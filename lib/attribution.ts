import { fromDataSuffix, toDataSuffix } from "@celo/attribution-tags";
import { bytesToHex, concat, hexToBytes, type Hex } from "viem";

const SCHEMA0_TAIL_BYTES = 18;

/**
 * Append ATTRIBUTION_CODE to calldata.
 * This app has no send path. Any future mainnet transaction must pass its
 * calldata through this function so the tag is on the wire.
 * Schema 0 tags already on the calldata are merged. A Schema 2 tag is left
 * as it is, because that suffix belongs to a facilitator, not this app.
 */
export function appendAttribution(calldata: Hex, code?: string): Hex {
  const resolved = (code ?? process.env.ATTRIBUTION_CODE ?? "").trim();
  if (!resolved) {
    throw new Error(
      "ATTRIBUTION_CODE is not set. Refusing to build calldata with no attribution tag.",
    );
  }

  const existing = fromDataSuffix(calldata);
  if (existing?.schemaId === 2) {
    return calldata;
  }

  if (existing?.schemaId === 0) {
    if (existing.codes.includes(resolved)) return calldata;
    const base = stripSchema0Suffix(calldata);
    return concat([base, toDataSuffix([...existing.codes, resolved])]);
  }

  const suffix = toDataSuffix(resolved);
  if (calldata === "0x") return suffix;
  return concat([calldata, suffix]);
}

function stripSchema0Suffix(data: Hex): Hex {
  const bytes = hexToBytes(data);
  if (bytes.length < SCHEMA0_TAIL_BYTES) return data;
  const codeLength = bytes[bytes.length - SCHEMA0_TAIL_BYTES] ?? 0;
  const suffixLength = codeLength + SCHEMA0_TAIL_BYTES;
  if (suffixLength > bytes.length) return data;
  return bytesToHex(bytes.slice(0, bytes.length - suffixLength));
}
