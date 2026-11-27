// Test 3: can an Altana session key pay a buy service over x402 on Celo?
// Free probe only: asks buy's gateway for its 402 quote (no payment is signed or sent) and
// checks whether Celo's USDC and USD₮ can verify a smart-wallet (ERC-1271) signature.
//
// The paid attempt needs our own funded session and is in docs/oh-jay-todo.md.
import { toFunctionSelector, parseAbi } from "viem";
import { client, A, save, errMsg } from "./lib.mjs";

const out = { test: "t3-x402", startedAt: new Date().toISOString(), probes: [], tokens: {} };

const probes = [
  { label: "chainstack celo rpc", url: "https://gateway.usebuy.ai/chainstack/celo", body: { jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] } },
];
for (const p of probes) {
  const r = { label: p.label, url: p.url };
  try {
    const res = await fetch(p.url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(p.body) });
    r.status = res.status;
    r.headers = Object.fromEntries(res.headers);
    const text = await res.text();
    r.body = text.slice(0, 6000);
    for (const h of ["payment-required", "x-payment-required"]) {
      if (r.headers[h]) {
        try { r.decoded = JSON.parse(Buffer.from(r.headers[h], "base64").toString("utf8")); } catch (e) { r.decodeErr = errMsg(e); }
      }
    }
    try { r.bodyJson = JSON.parse(text); } catch { /* not json */ }
  } catch (e) {
    r.err = errMsg(e);
  }
  out.probes.push(r);
}

// Which signature forms the tokens accept. EIP-3009 with a `bytes signature` argument is the
// ERC-1271-aware form (Circle FiatTokenV2_2); the (v,r,s) form only takes EOA signatures.
const sel = {
  transferWithAuthorization_vrs: toFunctionSelector("transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)"),
  transferWithAuthorization_bytes: toFunctionSelector("transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,bytes)"),
  receiveWithAuthorization_bytes: toFunctionSelector("receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,bytes)"),
  permit_bytes: toFunctionSelector("permit(address,address,uint256,uint256,bytes)"),
};
out.selectors = sel;
const slots = {
  eip1967: "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
  zeppelinos: "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3",
};
const meta = parseAbi(["function version() view returns (string)", "function name() view returns (string)", "function decimals() view returns (uint8)"]);
for (const [sym, addr] of [["USDC", A.USDC], ["USDT", A.USDT]]) {
  const t = { address: addr };
  for (const f of ["name", "version", "decimals"]) {
    try { t[f] = await client.readContract({ address: addr, abi: meta, functionName: f }); } catch (e) { t[`${f}Err`] = errMsg(e).slice(0, 100); }
  }
  let impl = addr;
  for (const [name, slot] of Object.entries(slots)) {
    try {
      const v = await client.getStorageAt({ address: addr, slot });
      if (v && BigInt(v) !== 0n) { impl = "0x" + v.slice(-40); t.implementation = { slot: name, address: impl }; break; }
    } catch { /* ignore */ }
  }
  try {
    const code = (await client.getCode({ address: impl })) || "0x";
    t.codeBytes = (code.length - 2) / 2;
    t.hasSelector = Object.fromEntries(Object.entries(sel).map(([k, s]) => [k, code.toLowerCase().includes(s.slice(2).toLowerCase())]));
  } catch (e) { t.codeErr = errMsg(e); }
  out.tokens[sym] = t;
}

out.finishedAt = new Date().toISOString();
save("t3-x402", out);
