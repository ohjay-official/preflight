// Test 4: can the "has anyone real paid it" check be built, fast and cheap?
// For real agent wallets on Celo: 30 days of USDC and USD₮ payments in, plus where each payer's
// money first came from. Compares two sources:
//   A. Blockscout's public API (free, indexed)
//   B. Plain RPC eth_getLogs (the same calls Chainstack's archive Celo RPC on buy would serve,
//      batched up to 2,000 calls a request at $0.01 a request; that paid run needs our funded float).
// Pass: the right payers back in under 10 s for under $0.05. Read-only.
import { getAddress, formatUnits, parseAbiItem } from "viem";
import { client, A, RIVALS, save, getJson, timed, errMsg } from "./lib.mjs";

const DAYS = Number(process.env.T4_DAYS || 30);
const FUNDING_DAYS = Number(process.env.T4_FUNDING_DAYS || 90);
const MAX_PAYERS = Number(process.env.T4_MAX_PAYERS || 12);
const TRANSFER = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");
const STABLES = { [A.USDC.toLowerCase()]: { sym: "USDC", dec: 6 }, [A.USDT.toLowerCase()]: { sym: "USDT", dec: 6 } };
const targets = (process.env.T4_ADDRESSES || [RIVALS.tractionCheckPayTo, RIVALS.errandAgent, RIVALS.agentGuardPayTo].join(","))
  .split(",").map((s) => getAddress(s.trim()));

const out = { test: "t4-payers", startedAt: new Date().toISOString(), days: DAYS, fundingDays: FUNDING_DAYS, targets: [] };
const now = Math.floor(Date.now() / 1000);
const since = now - DAYS * 86400;

// Block rate, to turn days into block ranges.
const latest = await client.getBlock();
const back = await client.getBlock({ blockNumber: latest.number - 100_000n });
const secPerBlock = Number(latest.timestamp - back.timestamp) / 100_000;
const blocksFor = (days) => BigInt(Math.ceil((days * 86400) / secPerBlock));
out.chain = { latestBlock: latest.number, secPerBlock };

// ---------- A. Blockscout ----------
let bsCalls = 0;
async function bs(params) {
  bsCalls++;
  const q = new URLSearchParams(params).toString();
  return getJson(`https://celo.blockscout.com/api?${q}`, { timeoutMs: 20_000 });
}
async function blockscoutPayments(addr) {
  const rows = [];
  for (let page = 1; page <= 5; page++) {
    const r = await bs({ module: "account", action: "tokentx", address: addr, sort: "desc", page: String(page), offset: "200" });
    const list = Array.isArray(r.result) ? r.result : [];
    rows.push(...list);
    if (list.length < 200 || Number(list.at(-1)?.timeStamp || 0) < since) break;
  }
  return rows
    .filter((x) => x.to?.toLowerCase() === addr.toLowerCase() && Number(x.timeStamp) >= since && STABLES[x.contractAddress?.toLowerCase()])
    .map((x) => ({ from: getAddress(x.from), token: STABLES[x.contractAddress.toLowerCase()].sym, value: x.value, hash: x.hash, time: Number(x.timeStamp) }));
}
async function blockscoutFunding(payer) {
  const firsts = [];
  try {
    const t = await bs({ module: "account", action: "tokentx", address: payer, sort: "asc", page: "1", offset: "5" });
    const x = (t.result || []).find((r) => r.to?.toLowerCase() === payer.toLowerCase());
    if (x) firsts.push({ kind: `token ${x.tokenSymbol}`, from: getAddress(x.from), time: Number(x.timeStamp), hash: x.hash });
  } catch (e) { firsts.push({ err: errMsg(e) }); }
  try {
    const t = await bs({ module: "account", action: "txlist", address: payer, sort: "asc", page: "1", offset: "5" });
    const x = (t.result || []).find((r) => r.to?.toLowerCase() === payer.toLowerCase() && BigInt(r.value || 0) > 0n);
    if (x) firsts.push({ kind: "CELO", from: getAddress(x.from), time: Number(x.timeStamp), hash: x.hash });
  } catch (e) { firsts.push({ err: errMsg(e) }); }
  const ok = firsts.filter((f) => f.time).sort((a, b) => a.time - b.time);
  return { firstFunding: ok[0] || null, seen: firsts };
}

// ---------- B. RPC getLogs ----------
let rpcCalls = 0;
async function findMaxRange(addr) {
  const to = latest.number;
  let range = blocksFor(DAYS);
  const tried = [];
  while (range >= 500n) {
    try {
      rpcCalls++;
      await client.getLogs({ address: [A.USDC, A.USDT], event: TRANSFER, args: { to: addr }, fromBlock: to - range, toBlock: to });
      tried.push({ range, ok: true });
      return { maxRange: range, tried };
    } catch (e) {
      tried.push({ range, ok: false, err: errMsg(e).slice(0, 160) });
      range /= 4n;
    }
  }
  return { maxRange: null, tried };
}
async function scanLogs(addrTopicIndex, addr, days, maxRange, budget) {
  const to = latest.number;
  const from = to - blocksFor(days);
  const need = Number((to - from) / maxRange) + 1;
  if (need > budget) return { skipped: true, callsNeeded: need };
  const logs = [];
  for (let start = from; start <= to; start += maxRange) {
    const end = start + maxRange - 1n > to ? to : start + maxRange - 1n;
    rpcCalls++;
    const args = addrTopicIndex === 2 ? { to: addr } : { from: addr };
    logs.push(...(await client.getLogs({ address: [A.USDC, A.USDT], event: TRANSFER, args, fromBlock: start, toBlock: end })));
  }
  return { callsNeeded: need, logs };
}

for (const addr of targets) {
  const t = { address: addr };

  // A
  bsCalls = 0;
  try {
    const { value, ms } = await timed(async () => {
      const pays = await blockscoutPayments(addr);
      const payers = [...new Set(pays.map((p) => p.from))];
      const funding = {};
      for (const p of payers.slice(0, MAX_PAYERS)) funding[p] = await blockscoutFunding(p);
      return { pays, payers, funding };
    });
    const funders = Object.values(value.funding).map((f) => f.firstFunding?.from).filter(Boolean);
    t.blockscout = {
      ms, requests: bsCalls, costUsd: 0,
      payments: value.pays.length,
      payers: value.payers,
      totals: value.pays.reduce((m, p) => ((m[p.token] = (m[p.token] || 0) + Number(formatUnits(BigInt(p.value), 6))), m), {}),
      funding: value.funding,
      payersFundedByTarget: Object.entries(value.funding).filter(([, f]) => f.firstFunding?.from === addr).map(([p]) => p),
      sharedFunders: [...new Set(funders.filter((f, i) => funders.indexOf(f) !== i))],
    };
  } catch (e) { t.blockscout = { err: errMsg(e) }; }

  // B (RPC only for the first target, to keep the run short)
  if (targets.indexOf(addr) < Number(process.env.T4_RPC_TARGETS || 1)) try {
    const range = await findMaxRange(addr);
    t.rpc = { maxRange: range.maxRange, rangeTries: range.tried };
    if (range.maxRange) {
      const before = rpcCalls;
      const { value, ms } = await timed(async () => {
        const pays = await scanLogs(2, addr, DAYS, range.maxRange, Number(process.env.T4_RPC_BUDGET || 700));
        if (pays.skipped) return { pays };
        const payers = [...new Set(pays.logs.map((l) => getAddress(l.args.from)))];
        const funding = {};
        let fundingCalls = 0;
        for (const p of payers.slice(0, MAX_PAYERS)) {
          const f = await scanLogs(2, p, FUNDING_DAYS, range.maxRange, Number(process.env.T4_RPC_FUNDING_BUDGET || 50));
          fundingCalls += f.callsNeeded;
          if (f.skipped) { funding[p] = { skipped: true, callsNeeded: f.callsNeeded }; continue; }
          const first = f.logs.sort((a, b) => (a.blockNumber < b.blockNumber ? -1 : 1))[0];
          funding[p] = first ? { from: getAddress(first.args.from), block: first.blockNumber, hash: first.transactionHash } : null;
        }
        return { pays, payers, funding, fundingCalls };
      });
      const calls = rpcCalls - before;
      t.rpc = {
        ...t.rpc, ms, calls,
        paymentCallsNeeded: value.pays.callsNeeded,
        payments: value.pays.logs?.length ?? null,
        payers: value.payers ?? null,
        funding: value.funding ?? null,
        // Chainstack on buy: one paid request carries up to 2,000 calls. Its own getLogs range limit is not verified.
        chainstackRequestsIfBatched: Math.ceil(calls / 2000),
        chainstackCostUsdIfBatched: Math.ceil(calls / 2000) * 0.01,
        nativeCeloFundingSeen: false,
      };
    }
  } catch (e) { t.rpc = { ...(t.rpc || {}), err: errMsg(e) }; }

  if (t.blockscout?.payers && t.rpc?.payers) {
    const a = new Set(t.blockscout.payers), b = new Set(t.rpc.payers);
    t.agreement = { onlyBlockscout: [...a].filter((x) => !b.has(x)), onlyRpc: [...b].filter((x) => !a.has(x)) };
  }
  out.targets.push(t);
}

out.summary = out.targets.map((t) => ({
  address: t.address,
  blockscout: t.blockscout?.err ? { err: t.blockscout.err } : { ms: t.blockscout?.ms, requests: t.blockscout?.requests, payers: t.blockscout?.payers?.length, payments: t.blockscout?.payments },
  rpc: t.rpc?.err ? { err: t.rpc.err } : { ms: t.rpc?.ms, calls: t.rpc?.calls, maxRange: t.rpc?.maxRange, payers: t.rpc?.payers?.length, estCostUsd: t.rpc?.chainstackCostUsdIfBatched },
  agreement: t.agreement || null,
}));
out.finishedAt = new Date().toISOString();
save("t4-payers", out);
