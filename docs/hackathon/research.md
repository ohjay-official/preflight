# Research: Agents Open for Business (Celo × Loops House)

Stage 1 research, v2 (24 Nov 2026). v1 skipped parts of the brief; this version adds the judges and people, winners' actual code, comparable hackathons outside Celo, the full FAQ, live competition, and the technical unknowns. Every fact has a source; all read 24 Nov 2026 unless noted. Numbers, dates and addresses are copied as published; rule wording is paraphrased closely.

Contents
1. The event in one screen
2. How judging really works
3. The four tracks
4. The judges and the people behind them
5. The organisers and sponsors
6. Comparable hackathons and what won
7. What the winners' code shows (the real bar)
8. The live competition in this event
9. Technical facts and gotchas
10. Insights
11. Still unverified

---

## 1. The event in one screen

| Item | Detail |
|---|---|
| Event | Agents Open for Business, CeloDevs' final hackathon of 2026, on Loops House |
| Page | https://www.loops.house/agents-open-for-business |
| Prize pool | $5,000, set in USD, paid in CELO to the payout wallet you register |
| Build window | Opened Fri 20 Nov 2026, 14:00 GMT |
| **Deadline** | **Mon 7 Dec 2026, 09:00 GMT = 10:00 WAT.** Registration and submission both close then |
| Winners | Fri 11 Dec 2026 |
| Brief | Start with a task a real person or business needs done, build the agent that does it, show it working on Celo mainnet with tagged onchain activity |
| Tracks | 4. Enter any number; one project can win in up to two, one placement per track |
| Live stats (24 Nov) | 140 builders registered, 8 submissions listed (loops.house/agents-open-for-business/winners) |
| Telegram | t.me/celoagenthackathons, 559 members; messages are not public without joining |

**Timeline (GMT; Lagos is +1h):** Fri 20 Nov 14:00 build opens and kickoff stream · Tue 24 Nov 14:00 Self stream (Agent Vault, Agent ID) and AskBots round 1 · **Wed 25 Nov 14:00 Altana stream** · Tue 1 Dec 14:00 Stablecoin Corridors stream · Fri 4 Dec AskBots round 2 · Mon 7 Dec 09:00 close · Fri 11 Dec winners. Office hours every Thursday 12:00 GMT. Livestream links: kickoff youtube.com/watch?v=E3HUsW-X7EA, Self youtube.com/watch?v=ccos5Dak-Pk, Altana youtube.com/watch?v=MYMouKWtOQM (YouTube pages could not be fetched from this session; not watched).

**Rules (event page and FAQ):**
1. Celo mainnet only; testnet references in the repo are fine.
2. Every entry registers its agent on ERC-8004 (required in every track), from the agent's own wallet, before the deadline. Self Agent ID recommended.
3. Public GitHub repo at registration that still resolves at judging.
4. An attribution tag (ERC-8021 code issued at enrolment) in every transaction you want counted; it cannot be added later. x402 sellers register their PayTo address at sign-up because x402 payments carry no tags yet.
5. Code written during the hackathon, from 20 Nov.
6. Up to two track wins, one placement each.
7. Sponsored gas is not a builder contribution; signers and authorisers still count, so describe any gas sponsorship in the submission.
8. Paid calls from your agent to services on buy count in your favour as real use, in every track.
9. Follow @Celo and @CeloDevs.

**FAQ points that matter:**
- Independent user = a wallet outside the team not funded by you or your main funder; new or existing Celo users count; an agent wallet with its own ERC-8004 identity registered by another team counts when it pays you. Pools, routers, Textile makers and exchange wallets don't count; arbitrage and self-trading score zero.
- New-to-Celo users are welcome; say in the submission who they are and how you reached them.
- Any agent framework; what matters is onchain activity and whether a real person uses it.
- Late registration is fine: register, add the tag and PayTo before sending anything you want counted.
- Concerns are raised privately with 48 hours to reply; nobody is disqualified by a dashboard; say where users and volume came from.
- Prizes in CELO; Altana XP goes straight to the Altana wallet on the Keystore.
- Faucets until 7 Dec: CELO code PM2M4C (0.25 per claim), USD₮ code QXO4ND (0.10 per claim).
- Support: Telegram, Thursday office hours, Self's Discord (Agent ID, Agent Vault), Altana's Telegram.

---

## 2. How judging really works

**Stated for this event:**
- Stablecoin Corridors and Altana: quality of execution, clear value proposition, initial traction with tagged onchain activity, named user with a real job done; **25% each**.
- Agent Vault and Self Agent ID: integration quality 30%, innovation and value proposition 30%, named user and real job 25%, real use 15%.
- Missing a track requirement means not scored in that track.
- **Celo DevRel shortlists from onchain data plus the Loops judge's reading of the repo.** Then the sponsor judges their track.
- Corridors traction text: tagged transactions and x402 payments to registered PayTo addresses, from independent users, during the window; **repeat use weighs more than one-off volume**; paid buy calls count.
- Named-user text: names a person or business, the job, and what it saves them in time or money.

**From the previous Loops House × Celo edition (Agents on Open Rails FAQ):** each track was scored by a query published before the window opened, a live leaderboard ran on that same query, and a human panel made the final call using that query data plus the Loops judge's reading of the repository. Expect the same machinery here; whether this edition's query is published was not verified (ask in Telegram or office hours).

**The Loops judge** (loopshouse.hashnode.dev): an AI judge reading the repo, pitch and demo video together; objective parts (technical execution, match to the bounty, checked against the code, with an eye on integration quality) and subjective parts (creativity) kept closer to humans.

**AI judging lessons from Synthesis** (EF hackathon, 685+ submissions, devfolio.co/blog/synthesis): agent judges did code reviews, deployment checks and cross-referenced README claims against what was deployed, about 15–20 minutes per shortlisted project; they lacked taste, so humans decided. Shortlisted projects got a full code audit.

**AskBots** (askbots.ai): a Celo marketplace where AI reviewer agents (Site Navigator, Endpoint Specialist, Protocol Reviewer for MCP, Skill Auditor, Mini App Expert) review sites, APIs, MCP servers and mini apps. For this event every registered repo gets two reviews posted as GitHub issues (24 Nov, 4 Dec). In Agents at Work a whole track paid for improvement between AskBots rounds.

---

## 3. The four tracks

### Track 1: Stablecoin Corridors (Textile FX). $1,000 / $600 / $400
- Build: an agent that pays, gets paid or pays out in a local stablecoin for a named person or business, converting on Textile FX between USD₮ and cNGN, IDRX or Ripio wFIAT (wARS, wBRL, wMXN, wCOP).
- Requirements: tagged Textile conversion on mainnet in a listed corridor, in the product flow; local-stablecoin payments reach someone outside the team; ERC-8004; no arbitrage, self-trading or making.
- Judges: Textile and Celo Core Co.
- Sponsor's idea list: freelancer payouts; merchant pricing in reais; supplier payments for an importer; household bill pay in naira; x402 service priced in local currency.
- Addresses: USD₮ 0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e · cNGN 0xF6829D7393dAe24509eb1E52eE8e572e2E271a4f · IDRX 0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22 · wARS 0x0DC4F92879B7670e5f4e4e6e3c801D229129D90D · wBRL 0xD76f5Faf6888e24D9F04Bf92a0c8B921FE4390e0 · wMXN 0x337E7456B420bD3481e7FA61fA9850343d610d34 · wCOP 0x8a1D45e102e886510e891d2Ec656a708991e2D76 · Textile LimitOrderReactor 0xa9AA0a64769cBed4d3B1Ceb4Df01CdE915C235b3
- **Shift since last edition:** Open Rails' Textile lane rewarded makers on strategy P&L, volume quoted and filled, and originality (winners Arbolito, Skew). This time makers are excluded; Textile wants takers moving real money for named people.

### Track 2: Agent Vault: Online & Onchain Checkouts (Self). $700 / $300
- Agent signs in or checks out on a regular website through Agent Vault (card and password never reach the agent) and pays onchain with x402.
- Requirements: one real website sign-in or checkout (sign-in alone qualifies); one x402 payment through Celo's facilitator (submit hash); a spending limit with the demo showing the limit hit; demo shows the agent never sees card or password; ERC-8004; public X post tagging @selfxyz and @Celo.
- How it works (docs.agentvault.io): person sets up card, address, identity in a web dashboard; agent connects via local MCP (npx), hosted MCP or a TypeScript SDK; first fill on a new site pauses for dashboard approval (about 15 minutes); starter limits $75 per transaction, $200 per week, $500 per 30 days; free accounts get 5 payments per 30 days.
- Phone-only reality: the agent must drive real websites from a server. Hardest track without a laptop.

### Track 3: Self Agent ID: Verified Agent Payments (Self). $700 / $300
- A service where Self Agent ID decides which agents get served, paid or limited, with x402 payments.
- Requirements: agent registered on mainnet (judges check `GET https://agent-api.self.xyz/api/agent/info/42220/<agentId>`); one x402 payment via Celo's facilitator; identity changes behaviour (SelfAgentVerifier or registry read; link file and line); **demo shows a verified agent paying or paid and an unverified agent turned away**; per-person limits shared across two agents of one person; ERC-8004; public X post tagging @selfxyz and @Celo.
- Self's tip: the agent that gets turned away is your best moment.
- Self's idea list: Drop Guard, Agent Tab, Dispute Kit, age-checked checkout, Fair Cashback on MiniPay, Know-Your-Agent gateway, Agent Passport.
- Personal step: a human scans a passport (or EU ID / Aadhaar) NFC chip in the Self app. **Nigeria is fully supported** for e-passports (docs.self.xyz supported-countries). Testnet takes mock passports only; real passports work on mainnet. Registration paths: SDK `requestRegistration({ mode: 'wallet-free' })`, CLI (`npx -p @selfxyz/agent-sdk self-agent register ...`), Postman, or the web UI at app.ai.self.xyz/register; the human scans a QR or deep link with the Self app. Default sybil limit is one agent per human.
- Registry 0xaC3DF9ABf80d0F5c020C06B04Cced27763355944. SDK `@selfxyz/agent-sdk`.

### Track 4: Altana Agent Wallets (Altana). $750 + 25,000 XP / $250 + 10,000 XP
- Agent acts from a non-custodial Altana wallet under a session key a person grants: spend cap, contract allowlist, expiry, enforced onchain, revocable in one transaction. Grants live in the public Keystore on Celo.
- Requirements: agent acts from an Altana wallet on mainnet; at least one session key with cap, allowlist or expiry shown in the demo; **demo shows a revoke transaction and the agent stopped**; ERC-8004.
- Altana's idea list: swap agent under a daily cap; LP manager on approved pools; payroll under a weekly cap; agent that hires other agents.
- Product reviews: 5,000 XP each, up to 10, one per team, posted in Altana's Telegram SDK bug-report channel with a tx hash.
- Mainnet: KeyStore 0x83b30935f36d6ccf9B1ec3b5E47F2866b97cd27c · KeyStoreController 0x47bA5fc2A5b0CcB24BA3fAC9D4B59400eE9fd1D6 · Relay https://relay.altana.network. SDK `@altananetwork/sdk` + viem; MCP `bunx @altananetwork/mcp`.
- See section 9 for the Celo-specific risks found in the docs.

---

## 4. The judges and the people behind them

The event page's Speakers tab is empty; it names judging organisations only. The people below run those organisations.

**Celo DevRel (shortlists every track)**
- Lena Hierzi (DevRel; signed the Feb–Mar 2026 hackathon newsletters), Susanne Zarpellon (DevRel; signs the newsletters since July and co-hosts office hours), Viral Sangani (AI Lead at Celo; ran office hours for Build Agents v2).
- Across seven 2026 agent hackathons their scoring moved from "highest 8004 reputation" and "most transactions" toward named users, independent counterparties and repeat payments (see section 6).

**Textile (Corridors)**
- Tomer Bariach, CEO and co-founder; previously Credit Collective and protocol lead at GoodDollar (rocketreach) — which fits the cNGN↔G$ corridor Textile lists.
- Benoit Nolens, co-founder, builds in public; on 100 days of Textile FX he posted $15.3M traded, 5,317 swaps and 645 traders, growing from $360K in June to $7.8M in August (x.com/be4oit).
- Textile started as onchain private credit on Celo (10 pools in Nigeria, Colombia, Kenya and more; partnering with Tala on a credit pool, May 2026), then moved to onchain FX.

**Celo Core Co. (Corridors)**
- The unified company of cLabs and the Celo Foundation. Markus Franke (Celo Core Co.; founder of Mento Labs, onchain FX) is quoted on stablecoin launches; Marek Olszewski is a Celo co-founder.

**Self (Agent Vault, Self Agent ID)**
- Self Labs was started by Celo core members Rene Reinsberg, Marek Olszewski and Eric Nakagawa after acquiring OpenPassport from Florent Tavernier and Remi Colin; raised $9M seed; serves 14M+ users; acquired agent startup Loam (April 2026); provides proof-of-human and sanctions screening for Tether's USA₮.
- **Past hackathons judged:** Self prizes at ETHGlobal Taipei and Buenos Aires. Winners were identity-gated ticketing, event registration, "one claim per person" and age checks (Zhat's Me, my-self-ticket, Register Yo Self, buy4me, HeirDrop). Pattern: identity has to change what the product does.

**Altana (Altana track)**
- Altana Network, formerly Functor Network ("cross-chain key and authorization layer for AI agents"); RootData lists Doris Hernandez as co-founder and CEO. Do not confuse with Altana AI, the New York supply-chain company.
- Integrated as a wallet option in BNB Agent Studio v2 (Aug 2026). No prior Celo hackathon track found.

**Loops House (platform and AI judge)**
- AI-native hackathon platform that also runs hacker houses (Shanghai, Buenos Aires, New Delhi); founders not named publicly.

---

## 5. The organisers and sponsors

- **Celo's 2026 positioning:** where the world's money meets local markets; 33 stablecoins across 20 currencies. This is the 7th CeloDevs agent hackathon of 2026.
- **Celo Agent Visa** (celo.org/agent-visa.txt): Tourist (1 tx + Self Agent ID), Work (1,000+ txns and $5K+ volume), Citizenship (10,000+ txns or $15K+); rewards human-backed agents with real volume.
- **MiniPay:** 20M+ activated wallets; moving to Privy (Stripe) from 19 Nov 2026. "Pay with MiniPay" pays any Nigerian bank account from a USD₮ balance (Partna, Dec 2025). Funding via Binance Connect.
- **x402 on Celo:** hosted facilitator settles 10 stablecoins: USDC, USD₮, USA₮ plus wARS, wBRL, wMXN, wCOP, wPEN, wCLP and **cNGN**. Sellers get an API key at x402.celo.org; up to 100 free mainnet credits (may need GitHub sign-in), then gas plus 0.3%.
- **cNGN:** regulated naira stablecoin (WrappedCBDC); on Celo since Aug 2026 with Textile as day-one partner; Textile reported 78 Nigerian OTC and payment firms onboarded and $4M+ July volume. A cNGN–USD₮ pool also exists on Uniswap on Celo. Busha lists cNGN (2025 reporting said BSC and Base; Celo withdrawals not verified).
- **AbaPay** (Nigeria): stablecoins to airtime, data, electricity, cable, education PINs and bank transfers; MCP at agents.abapays.com/api/mcp; sells over x402. Won Value Moved and Real World Adoption (Agents at Work) and Most x402 Payments (Agentic Payments & DeFAI).
- **buy** (usebuy.ai): Celo Core Co.'s agent services marketplace (compute, chain, data, browsers), paid per request; `npm install -g @celo/buy` (Node 22+).
- **Prezenti Frontier pool:** $45,000 for AI and agent infrastructure on Celo, grants up to $15,000, applications until 29 Dec 2026. Funds enabling infrastructure, not standalone end-user apps; needs a working Celo deployment, ERC-8004, Self Agent ID, verifiable mainnet transactions and a plan for the first 10–100 users.

---

## 6. Comparable hackathons and what won (17 events)

### Celo's own 2026 agent series
| Event | Winners | What won |
|---|---|---|
| Build Agents for the Real World v2 (Mar) | Agentopolis 1st; SocialClaw 2nd; Toppa and AgentHands 3rd; Celo8004 (infra); Toppa (agentscan) | Toppa: airtime, data, bills in 170+ countries over x402 |
| Synthesis, Celo track (Mar) | SocialClaw, Synthlend | SocialClaw: P2P social lending; an AI judging agent from CeloDevs picked them |
| Onchain Agents (May–Jun) | RemitRoute 1st ($2,500); AjoAI 2nd; Monipay 3rd; Spawn Protocol (activity) | RemitRoute: always-on agent running one plain-language rule; AjoAI: savings circle agent in MiniPay |
| Agentic Payments & DeFAI (Jul–Aug; 89 projects, 875K txns) | Binary (revenue); AbaPay (x402 payments); RemitRoute 2nd | Revenue and payment counts |
| Agents at Work (Aug–Sep) | AbaPay (Value Moved, Adoption); Earmark, CeloDesk, Compute Router, Tenda, ThothPay (stablecoin flows); **Kobo** (Judges' Favourite: naira transfers with cNGN gas) | Real value moved between independent parties |
| Agents on Open Rails (Oct–Nov; Loops House; 305 registered, 105 submitted) | TesorerIA, Adelanto (LatAm); Arbolito, Skew (Textile makers); Earmark, ORYN (USA₮ x402); Traction-Check, Anon, Assay, Contest Radar, Growth Scout (buy) | Real groups of users; see section 7 |

### Outside Celo
| Event | Winners / criteria | Pattern |
|---|---|---|
| SF Agentic Commerce x402 (Feb 2026; 324 registered, 86 builds) | World of Geneva, Moltbet, Superpage, Pincer, RequestTap; judged on partner integration, agentic depth, commerce realism, polish | Real commerce flows |
| Solana x402 (Nov 2025) | Intelligence Cubed, PlaiPin (ESP32 hardware wallet), x402 Shopify Commerce, Amiko (credit profiles), MoneyMQ | Practical merchant use and trust primitives |
| Algorand Agentic Commerce x402 Berlin (Jun 2026; 42 projects) | Trust was the common focus; checkout, freelance, mail | Trust between paying agents |
| BSV Open Run AgenticPay (Apr 2026) | Dolphin Sense: 90 agents settling via x402 | Scale of agent-to-agent payments |
| Coinbase Agents in Action (2025) | Winners "nailed real-world revenue flows" | Revenue |
| EasyA × Consensus Miami (2026) | Dairy Price API x402 won the Coinbase/AWS track | Simple paid API |
| Synthesis (EF, 685+ submissions) | AI judges checked README vs deployed code; humans supplied taste | Exact claims |
| ETHGlobal Taipei / Buenos Aires, Self prizes | Identity-gated ticketing, registration, claims | Identity changes behaviour |
| BNB Hack: AI Trading Agent (Jul 2026; 21 winners, $36K) | Trading agents and reusable strategy skills | Not our lane |
| Kraken × ERC-8004 (lablab) | Leaderboard by validation and reputation | Leaderboards reward activity |
| cNGN-related builds (HackQuest NairaStable on Arbitrum) | Naira stablecoin experiments | Little naira consumer work has won |

That is 17 events, not the 50 the playbook aims for over time; the Celo series is the most relevant and is covered fully.

---

## 7. What the winners' code shows (the real bar)

Read from the repos (cloned 24 Nov):

**TesorerIA (1st, LatAm, $1,500)** — github.com/ruizemanuel/TesorerIA
- Product: a group's shared peso fund for eight friends who split a football pitch every Thursday, plus a Friday barbecue fund.
- Proof as of 8 Nov: 55 contributions, ARS 490,139 in, ARS 490,033 out, everyone paid up at every weekly close; a member cashed out to a bank via Ripio.
- Design: money moves only through deterministic code with tests; the AI is a chat that never signs; the contract only lets the agent pay members, never above a weekly cap; passkey Safe accounts with sponsored gas.
- Polish: verified contracts, a public read-only fund page with names hidden, a cost-per-group calculation (about US$0.10 a week for eight people), honest known risks, and a growth target (5 groups by 31 Dec).
- Lesson: one tiny real group used weekly beat bigger claims.

**Adelanto (2nd, LatAm)** — github.com/Jennycruzy/adelanto
- Five verified contracts, 296 TypeScript and 232 Solidity tests, a whole loan run in MiniPay on an iPhone.
- The borrower's rule is stored onchain as a hash of their exact words; the agent quotes it when it acts.
- A transparency page labels every wallet as team, judges or others; `npm run verify` rebuilds every loan from the chain; an attribution audit showed 63 of 63 transactions tagged.
- A five-minute judges' guide; x402 sales to other agents; paid buy calls for a second chain read before moving money; ERC-8004 ratings from real borrowers.
- Real users: 7 loans, 2 from outsiders.
- Its "what we found" list of mainnet gotchas is reused in section 9.

**Earmark (1st, USA₮ x402; also Agents at Work)** — github.com/AustinChris1/Earmark, Nigerian builder
- Telegram bot for group collections locked to one destination; pays Nigerian electricity and airtime through AbaPay over x402; accepts 26 stablecoins swapped on Textile; Lagos and diaspora family use cases.

**Arbolito (1st, Textile maker; re-entered this event)** — github.com/Manuel-dev01/arbolito, Olamiye Emmanuel
- Now an AI money-changer in MiniPay and Telegram: dollars in; naira, pesos or reais out with an onchain receipt; batch payouts and scheduled payroll.
- Has a real tagged Textile fill of 1 USD₮ → 1,448.567082 cNGN. As of 24 Nov: no mainnet payout to outsiders and no named user yet.

**Common bar across winners:** solo builders; a live app; real outsiders using it repeatedly; every number traced to a transaction; a one-command verifier; a judges' guide; verified contracts; AI kept away from signing. Real-user counts were small (8 friends; 2 outsiders), but every one was documented.

---

## 8. The live competition in this event (24 Nov)

**Submitted on Loops House (8):** ProofPay (pay Nigerian freelancers in naira after an AI checks the work); RigBase Payout (contractor payroll, agent can't overspend); Vault Checkout Agent (Agent Vault + x402); **Arbolito** (naira/pesos/reais payouts, past winner); Tranox (freelancer milestones paid in local stablecoins); Sivan AI; PayPerTask; Celo Corridor Agent (IDRX supplier payments).

**Public repos found on GitHub (30+):** about 15 doing freelancer, contractor or supplier payouts and payroll in cNGN/IDRX (keel-payroll, rigbase-payout, celo-payroll-agent, JaybankOz payroll, tranox, nairaquote-pay, proofpay, invoice-link-celo, payroll-tab-celo, celo-payout-agent, supplier-pay-agent, lokal, nairatag-celo, freshroute, tanda); Altana spend-cap tools (Vex, tabline, caprail, ProcureYeti, vetgate); Self Agent ID gates (agentgate, bhav, bearproof); Agent Vault (vault-checkout-agent, bhav); Nigerian small-business agents (ikenga, ebun, growtendril).

**Read:** the naira payout lane is crowded and now includes a past Textile winner. Agent Vault has the fewest entrants. Consumer and household jobs, and anything outside the sponsors' example lists, are thin.

---

## 9. Technical facts and gotchas

**Attribution tags** (github.com/celo-org/attribution-tags BUILDERS.md):
- `npm install @celo/attribution-tags viem`; extend the wallet client with `withAttribution(code)` or pass `dataSuffix: toDataSuffix(code)` (viem ≥ 2.45).
- Verify with `verifyTx`.
- For ERC-4337 the suffix sits inside each UserOperation's callData; credit goes to `sender`, not the bundler.
- Codes are `[a-z0-9_]`; `withAttribution` doesn't cover batch `sendCalls`.
- Relayers that re-encode calldata can drop the tag.
- x402 settlements carry no tag yet (register PayTo).

**Textile FX RFQ v2** (fx-docs.textilecredit.com):
- Minimum $1 notional on mainnet; quotes last at most 60 s; no API key needed (taker signs a proof valid about 12 h).
- Approve the sell token to `quote.reactor` and wait for it to confirm before broadcasting `transactions.swap`; USD₮ may need allowance reset to 0.
- Fee is inside `takerPays`; no partial fills; `failed`/`expired` can flip to `filled` within 24 h.
- Corridors on Celo include cNGN↔USD₮ and cNGN↔G$.

**x402 on Celo** (x402.celo.org/skill.md):
- Price with an explicit `{ amount, asset, extra: { name, version } }`; a bare `"$0.01"` silently prices in USDC.
- wFIAT routes need `assetTransferMethod: "permit2"` and `extensions.eip2612GasSponsoring`.
- **cNGN has 6 decimals, no EIP-2612 permit, and the first payer must approve Permit2 onchain.**
- Buyers must add Permit2 assets to `allowedAssets`; two payments seconds apart can race on the nonce.

**Altana on Celo (risk):**
- Celo fee tokens accepted: CELO, USDC, USD₮, USA₮, EURm. ERC-8004 registry on Celo 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432.
- `grantSession` takes `permissions.calls` (allowlist by address only, no function selector) and `permissions.spend` entries with `limit`, `period` (e.g. "day") and `token`, plus `expiry`. Relay fees come out of the spend cap. The session object holds a private key; persist it with `serializeSession`. Keystore writes can take 15–30 minutes on L2s.
- The passkey-to-agent guide states that flow is BNB-only. The passkey quickstart lists BNB, Ethereum and Base, not Celo. The Celo setup example uses a private-key admin signer. An entrant reported the relay rejecting with "RPC Request failed"; another entrant (Vex) describes passkey wallet creation working.
- Net: how a real person becomes the admin of an Altana wallet on Celo from a phone is **unconfirmed**. Ask at the Altana livestream (25 Nov).

**Mainnet gotchas from Adelanto's build log:**
- MiniPay did not block unlisted contracts and set `feeCurrency` to the USD₮ adapter itself.
- Celo's `safe` block tag stalled about 3.9 days behind the tip, so read at the safe head or 60 blocks behind, whichever is newer.
- Public RPC nodes behind load balancers lag right after writes.
- The attribution code comes at enrolment, so send nothing before it.

**MiniPay testing:** Settings → About → tap version until developer mode → Developer Settings → Load test page with the HTTPS URL. Works on a phone; no emulator needed.

---

## 10. Insights

1. **The shortlist starts from onchain data.** DevRel filters on tagged activity first, then the AI reads the repo, then sponsors judge. An entry with no tagged activity from outsiders likely never reaches a human.
2. **Small, real and repeated beats big and claimed.** The bar is a named group of 5–10 real people using it more than once, every transaction linked, a judges' guide and a verify command.
3. **Avoid the naira payout and payroll lane.** It holds about 15 entries and a past Textile winner (Arbolito).
4. **Self is the most "Celo-family" judge.** Self Labs was founded by Celo's co-founders. It judges two tracks, is required for the Frontier grant, and Nigerian e-passports are supported. Its past winners all made identity change the product, and it asks to see the rejection.
5. **Altana is the riskiest track to build on from Celo right now.** Docs are BNB-first and the user-as-admin flow on Celo is unconfirmed. The livestream tomorrow decides whether it is viable.
6. **Agent Vault is least contested but hardest from a phone.**
7. **Corridors and Self/Altana can combine.** Same product, two tracks, if each requirement is met naturally.
8. **Nigerian rails exist to lean on:** Pay with MiniPay to any Nigerian bank, AbaPay bills over x402, cNGN on x402 and Textile ($1 minimum). Getting cNGN into ordinary users' Celo wallets is the friction; USD₮ in MiniPay is the easy entry.
9. **Distribution is Oh-Jay's edge.** Winners were solo builders with one real group. His X reach and Nigerian network can deliver a real group quickly if the job is one they already do weekly with money.
10. **Process to copy:** enrol and wire the tag before the first transaction; publish a transparency page that labels own wallets; ship a judges' guide and a verify command; keep AI away from signing.

## 11. Still unverified

- Whether this edition publishes its scoring query and live leaderboard.
- Altana: real-user admin flow on Celo (passkey vs private key), relay reliability.
- Self Agent ID end to end with a Nigerian e-passport on mainnet (docs cover testnet steps).
- How a Nigerian individual gets cNGN into, and out of, a Celo wallet (Busha networks for Celo unconfirmed).
- What the kickoff and Self livestreams said (YouTube not reachable from this session).
- Telegram announcements (group requires joining).

## 12. Corrections (26 Nov 2026, after the second assistant's review)

- Altana's track is officially "Smart Agentic Wallets" (event page). Agents that pay their own way over x402 inside the session cap are in scope.
- Altana session calls take `to`, `signature` (a method), or both; I wrote "address only" on 24 Nov, which was wrong. There is no recipient or exact-amount lock. Revoke is gated to key owner or validator, and a revoked session can't be revived (docs.altana.network/concepts/sessions).
- Altana charges a one-time Keystore registration fee, charged twice on a wallet's first admin action. `register: false` skips it, and amounts come from `quoteGrantSession` (docs.altana.network/sdk/grant-session). The "9.2 CELO" figure is unverified.
- Agent Vault: sign-in alone meets the track requirement. A card checkout is optional, and the x402 payment can be a small per-request payment (event FAQ). Entrants get 3 months of Agent Vault Plus free.
- Busha's API lists cNGN as deposit No, withdrawal No, networks N/A, ramp No, and lists no Celo network (docs.busha.io/guides/reference/supported-currencies). No consumer cash-out of cNGN from Celo is documented. Ripio's ramp to Celo does exist for wARS (event Corridors page).
- Open Rails' Textile lane was a maker lane (Arbolito and Skew were both makers). Its ranking isn't evidence that real users beat volume.
- Free Nigerian food price data exists: the NBS Food Price Tracking dashboard (daily, crowdsourced), the World Bank HFCP dataset, and PricePally's daily prices for 150+ items.
- Agent credit prior art: RSoft Agentic Bank won 1st at SURGE and 1st in LabLab × Arc's online track.

## 13. Live competition update (26 Nov 2026, 20:00 WAT)

- 174 builders registered, 16 submissions listed (loops.house/agents-open-for-business/winners).
- **Errand** (softalpha0/Errand, celo branch): local-money errands from the user's own wallet plus **Errand Guard**, an x402 API where any agent pays $0.01 USD₮ to have a payment checked before sending; Self Agent ID sets daily limits (100 checks verified, 3 otherwise). Pays $0.01 on buy for Chainstack Celo RPC after each errand. Altana passkey wallet creation and session screen built and live, but granting is switched off "until Altana confirms how grant/revoke transactions can carry the attribution tag". Named user: Chidera Mbamuzuru, ₦2,000 errand, 25 Nov.
- **AgentGuard** (Jarvis-184/agentguard): Altana wallet, USD₮ 0.50/day cap, allowlist, 14-day expiry; buys data over x402; public dashboard; x402 seller at $0.001. Its page says no independent user yet (26 Nov).
- **Hexbox Tools / Spendguard Scout** (HexboxTools/celo-spendguard): Altana EIP-7702 wallet; session key may call only `USDC.transfer`, $0.05/day cap, 14-day expiry; once a day the session funds a separate x402 spending key inside the cap, and that key pays buy services ($0.005 a call). A working pattern for paying x402 from Altana on Celo without Altana's own ERC-1271 x402.
- **CapRail**: Auto-DCA via selector-locked Altana session keys.
- **VetGate** is a Self Agent ID entry (one free x402 call per human per day), not Altana; section 8 listed it with Altana tools by mistake.
- Altana signer types are private key or passkey only; a browser or phone wallet cannot be the admin (docs.altana.network/use-cases/7-onboard-from-browser-wallets). `grantSession` accepts `sessionSigner` to bring your own session key (docs.altana.network/sdk/grant-session).
- buy shows 770 tools (usebuy.ai, 26 Nov); the event page says "over 700 services". Chainstack Celo RPC on buy: $0.01 a request, archive-capable, batches up to 2,000 calls. SQD on buy is free but doesn't name Celo.
- Blockscout lists Celo mainnet on its free API tier (docs.blockscout.com/devs/plans-and-credits).
