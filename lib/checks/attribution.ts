import { fromDataSuffix } from "@celo/attribution-tags";
import type { Address, Hex } from "viem";
import type { NormalizedTx } from "@/lib/activity/types";
import { PAYMENT_WINDOW_DAYS, windowStart } from "@/lib/config";
import { sameAddress } from "@/lib/format";
import type { AttributionCheck } from "@/lib/types";

const NOTE =
  "Tags are decoded from calldata only. This does not check that the call succeeded. A relayed or smart-account transaction whose outer input does not end in the tag is not counted. Transactions submitted by a relay, and not indexed to or from this address, are outside this count. This check does not change the pay verdict.";

export function decodeTag(input: Hex): { codes: string[]; schemaId: number } | null {
  try {
    const decoded = fromDataSuffix(input);
    if (!decoded || decoded.codes.length === 0) return null;
    return { codes: decoded.codes, schemaId: decoded.schemaId };
  } catch {
    return null;
  }
}

export function interpretAttribution(input: {
  address: Address;
  transactions: NormalizedTx[];
  nowUnix: number;
  readFailed: boolean;
}): AttributionCheck {
  if (input.readFailed) {
    return {
      id: "attribution",
      title: "Attribution tags",
      status: "Unread",
      summary: "Transactions could not be read, so attribution tags were not decoded.",
      tagged: 0,
      total: 0,
      codes: [],
      note: NOTE,
    };
  }

  const since = windowStart(input.nowUnix);
  const outgoing = input.transactions.filter(
    (tx) => sameAddress(tx.from, input.address) && tx.timestamp >= since,
  );
  const codes = new Set<string>();
  let tagged = 0;
  for (const tx of outgoing) {
    const decoded = decodeTag(tx.input);
    if (!decoded) continue;
    tagged += 1;
    for (const code of decoded.codes) codes.add(code);
  }

  const total = outgoing.length;
  const codeList = [...codes];
  let summary: string;
  let status: AttributionCheck["status"];
  if (total === 0) {
    status = "Not found";
    summary = `No transactions from this address in the last ${PAYMENT_WINDOW_DAYS} days.`;
  } else if (tagged === 0) {
    status = "Not found";
    summary = `None of the ${total} transaction${total === 1 ? "" : "s"} from this address in the last ${PAYMENT_WINDOW_DAYS} days end in an attribution tag.`;
  } else {
    status = "Live";
    summary = `${tagged} of ${total} transactions from this address in the last ${PAYMENT_WINDOW_DAYS} days carry an attribution tag. Decoded codes: ${codeList.join(", ")}.`;
  }

  return {
    id: "attribution",
    title: "Attribution tags",
    status,
    summary,
    tagged,
    total,
    codes: codeList,
    note: NOTE,
  };
}
