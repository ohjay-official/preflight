// Fallback check for test 4's outcome: if Preflight buys no data, its Altana action is an onchain
// receipt on the checked agent's ERC-8004 record. Is an ERC-8004 reputation registry live on Celo,
// and what does its write function look like? Read-only.
import { getAddress } from "viem";
import { client, A, save, getJson, errMsg } from "./lib.mjs";

const out = { test: "t5-receipt", startedAt: new Date().toISOString(), candidates: [] };

// Candidate addresses: the ERC-8004 reference deployment's vanity addresses (unverified for Celo).
const candidates = (process.env.T5_CANDIDATES || [
  "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
  "0x8004B663056A597Dffe9eCcC1965A193B7388713",
  "0x8004Cb1BF31DAf7788923b405b754f57acEB4272",
  "0x8004Cc8439f36fd5F9F049D9fF86523Df6dAAB58",
].join(",")).split(",").map((s) => getAddress(s.trim()));

for (const address of candidates) {
  const c = { address };
  try {
    const code = await client.getCode({ address });
    c.hasCode = Boolean(code && code !== "0x");
    c.codeBytes = code ? (code.length - 2) / 2 : 0;
  } catch (e) { c.codeErr = errMsg(e); }
  if (c.hasCode) {
    try {
      const r = await getJson(`https://celo.blockscout.com/api/v2/smart-contracts/${address}`);
      c.name = r.name;
      c.isProxy = r.proxy_type || null;
      c.implementations = r.implementations || null;
      const abi = r.abi || [];
      c.functions = abi.filter((f) => f.type === "function").map((f) => `${f.name}(${f.inputs.map((i) => i.type).join(",")})${["view", "pure"].includes(f.stateMutability) ? " view" : ""}`);
    } catch (e) { c.abiErr = errMsg(e); }
    for (const impl of c.implementations || []) {
      try {
        const r = await getJson(`https://celo.blockscout.com/api/v2/smart-contracts/${impl.address_hash || impl.address}`);
        c.implName = r.name;
        c.implFunctions = (r.abi || []).filter((f) => f.type === "function").map((f) => `${f.name}(${f.inputs.map((i) => `${i.type} ${i.name}`).join(",")})${["view", "pure"].includes(f.stateMutability) ? " view" : ""}`);
      } catch (e) { c.implAbiErr = errMsg(e); }
    }
  }
  out.candidates.push(c);
}

// The identity registry may point at its siblings.
try {
  const r = await getJson(`https://celo.blockscout.com/api/v2/smart-contracts/${A.erc8004Identity}`);
  out.identity = { name: r.name, proxy: r.proxy_type || null, implementations: r.implementations || null };
} catch (e) { out.identityErr = errMsg(e); }

out.finishedAt = new Date().toISOString();
save("t5-receipt", out);
