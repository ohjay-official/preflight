# Stage 2: Ideas, round 3 (24 Nov 2026)

Round 2's pick (Drop) was rejected: "not scalable." Drop grows one creator at a time and stays small per creator. Round 3 uses a scalability bar first:

1. Grows without us onboarding each user by hand (self-serve, API or SDK).
2. Sells to agents, the customers multiplying fastest, as well as people.
3. Gets better with every user (data, capital or network).
4. Has a 12-day wedge with real independent usage, and fits at least one track.

## Pick: Float, working capital for agent businesses

**Everyday version.** When a POS agent runs out of float, they borrow it and pay it back from the day's takings. Agent businesses on Celo hit the same wall. A payout agent pays a contractor before its client's money lands. An airtime agent tops up its provider wallet before orders come in. An agent needs $1 for Textile's minimum swap, or budget for paid buy calls. Float lends them working capital and takes repayment from what they earn onchain.

**How it works**
1. **Underwrite.** Read the agent's onchain earnings, counting only money from independent payers (the event's own definition: wallets it didn't fund). Check the agent is human-backed (Self Agent ID) and how much the same human already owes across all their agents.
2. **Advance.** Send USD₮. Starter limit $5–$20, rising with each repayment.
3. **Repayment mandate (Altana).** The borrower grants Float a session key on its Altana wallet that can only pay Float's contract, only the installment, only until the term ends. Float's agent collects as revenue arrives.
4. **Accountability (Self).** Revoking the key before repaying is a default, and the default follows the human: none of their agents can borrow again. An unverified agent is turned away. Other lenders can check a human's record (exposure and repayments, no personal data) for a fee per lookup over x402.

**Why only Celo:** per-human limits across agents need Self Agent ID (registry on Celo). Repayment mandates need Altana session keys. Underwriting reads x402 revenue onchain. Textile began as onchain credit pools (Nigeria, Colombia, Kenya), the natural capital source later.

**Tracks:** Self Agent ID (identity decides who is served and how much; unverified agent turned away; per-person limit across two agents; x402 lookups). Altana (agent acts under a session key; revoke shown and the agent stopped). Fits Prezenti Frontier (agent infrastructure, needs ERC-8004 and Self Agent ID).

**Wedge in 12 days:** other teams' agents need float now for buy calls, Textile's $1 minimum and prefunding. 5–10 small advances to Self-verified agents. Each installment is a tagged transaction from an independent wallet, repeated, which is what the traction query rewards. Other teams' agents count as independent users (FAQ).

**Scale path:** every agent business is a borrower; pools fund the advances; lenders pay to query the human-level record; later, human micro-merchants (POS operators) on the same rails.

**Risks, said straight**
- We lend real money. Pool size is his call ($50–$100 to start).
- Borrowers must register with Self, which needs an e-passport. That's fine for global devs and harder for Nigerian builders. His own passport is needed to register Float's agent.
- The need is a hypothesis. Validate by asking 5 agent builders in the event Telegram before building.
- Altana on Celo, as before. If it fails, repayment runs through a revenue-split contract and Float still competes in Self.
- Lending is regulated. Keep it a prototype between builders, with small amounts and plain terms.

## Alternatives considered this round

- **Local (Corridors):** any agent pays a naira- or peso-priced x402 service from USD₮, converted at Textile's rate just in time, with netting to clear Textile's $1 minimum. It scales with all agent commerce, and Celo added cNGN and three wFIATs to x402 in October, but the facilitator converts nothing. Weakness: few sellers price in local currency yet, and naira recipients must be able to use cNGN.
- **Purchase protection for x402:** buyer agents pay a small premium; a failed paid call is refunded; per-human claim caps stop sybil claims (Self). Weakness: close to Veridict (arbitration) and regulated as insurance.
- Dropped as unscalable or crowded: agent spend cards (five Altana entrants already), rewards that reach only humans (Self's own list; passports limit African users), agent storefronts for WhatsApp merchants (no agent buyers yet).

---

# Stage 2: Ideas, round 2 (rejected 24 Nov: "not scalable")

Round 1 (Abeg and the household-payment shortlist, kept in `ideas-round1.md`) was rejected by Oh-Jay on 24 Nov 2026: "you can do 100% way better." Round 2 starts from scratch. Contri and anything savings-circle related stays excluded.

## Why round 1 failed

- Abeg asked families to start a new habit: ask an agent instead of the person paying. Past winners moved a money habit that already happened every week onto Celo (TesorerIA: eight friends' Thursday football fund).
- The agent mostly routed requests. AbaPay did the hard part, and AbaPay is entered in this event.
- It entered one track, and that track depends on the riskiest sponsor (Altana).
- None of Oh-Jay's own edge went into it: creators, X reach, bounty and hackathon craft.

## New facts that reshaped the field (checked 24 Nov 2026)

1. **Agents hiring humans is already done on Celo.** AgentHands ("AI agents hire verified humans for physical-world tasks on Celo and Base", karmahq.xyz/project/agenthands) placed 3rd in Build Agents v2 (March). Loopuman is ERC-8004 agent #17 routing tasks to human workers. HumanOracle and PerkyJobs (Self + USDT job marketplace) cover the same ground. RentAHuman, the original, is YC-backed (ycombinator.com/companies/rentahuman).
2. **Influencer marketing on Celo is already done.** Ads-Bazaar: "Nigerian businesses pay in Naira, Kenyan influencers earn in Shillings", with Self KYC for influencers on its roadmap (karmahq.xyz/project/ads-bazaar).
3. **Agent trust and reputation tooling is crowded.** Assay (ETHGlobal Lisbon 2026), Veridict (arbitration, Celo agentId 2312), Celo Agent Marketplace, SelfClaw, and QuickNode's ERC-8004 explorer, which already shows a sybil score per agent.
4. **Provably fair raffles already exist on Celo.** CeloRaffle (agent-run lottery) and Celottery (SelfClaw-verified agent sells raffle tickets over HTTP 402) (karmahq.xyz).
5. **X banned paying people to post.** Since 15 Jan 2026 X revokes API access from apps that give "tokens, points, or cash in exchange for engagement" (theblock.co/post/385847). Any idea built on paying for posts is out, and nothing below touches X's API.
6. **Other teams' agents count as independent users** when they pay you, and paid calls to buy services count for the caller (event FAQ, research.md §1).
7. **MiniPay in Nigeria:** users fund it through local onramps including OPay (rallies.ai, June 2026), and it pays any Nigerian bank from USD₮ (minipay.to, Dec 2025). Q3 update: in Africa, card spending clusters on software, developer tools, cloud and subscriptions; the best Mini App categories are bills, savings, local payments, microwork and utilities (forum.celo.org MiniPay Update Q3 2026). The `browse` deeplink opens only approved Mini Apps (docs.celo.org MiniPay deeplinks), so MiniPay distribution needs Opera's approval.
8. **Agent Vault is more buildable than round 1 assumed.** Its hosted MCP launches a cloud browser per session (`open_page`, `click`, `fill_checkout`, `snapshot_page`), has a Buy wallet tool (`pay_request`), lets an agent open accounts with the owner's approval, and hands 3-D Secure, codes and CAPTCHAs to the human. It connects to Grok Bot. The identity vault covers name, contact details and addresses; no passport or date-of-birth field is documented (docs.agentvault.io llms.txt, mcp/tool-reference).
9. **cNGN on Celo is institutional.** Textile onboarded 78 Nigerian OTC and payment firms (crypto-reporter.com, Aug 2026). No consumer off-ramp from Celo was found. x402 accepts cNGN but converts nothing, so the buyer must already hold cNGN (stablecoininsider.org, 31 Oct 2026).
10. **Every track depends on something.** Altana (wallet admin flow on Celo), Self Agent ID (his e-passport), Agent Vault (works, see 8), Corridors (recipients who can use a local stablecoin). The pick should survive losing one of these.

## Step 1: Go wide (22 new candidates)

Format: **who shows up → what they do → what they walk away with** · tracks (C Corridors, V Agent Vault, S Self Agent ID, A Altana) · status

1. **Drop.** A creator who runs airtime or data giveaways and "predict the score" contests → followers enter with a phone number; entries lock onchain; winners come from a future block anyone can recompute; airtime lands within a minute, paid from the creator's own capped wallet → the creator saves hours and can prove nothing was rigged · A, S
2. **Admit.** A Nigerian applying for a Masters abroad → the agent signs into each university portal with the saved login, fills the repeated details, pays the fee with the vaulted card and stops at the limit → applications done; the agent never saw a password or card number · V, S
3. **Detty December arrival.** A diaspora visitor flying home → before landing, the agent buys their data, pays the airport pickup and the shortlet balance from USD₮ inside a trip budget → lands sorted · V, S
4. **Scout.** A builder or bounty hunter → asks for a win-dossier on any hackathon or bounty (judges, past winners, what's already submitted, gaps) → the agent buys the research on buy inside a weekly budget the person sets → picks a better idea in an hour · A, S
5. **Mini-import desk.** A Nigerian mini-importer → the agent reorders stock on AliExpress with a stablecoin-funded card in the vault and pays the freight agent in USD₮ → no 5–10% payment-agent cut · V
6. **Naira Router.** Any agent holding USD₮ → pays naira- or peso-priced x402 services; the router converts on Textile just in time → local-currency pricing becomes usable · C
7. Promo Desk: agents buy disclosed sponsored posts from human creators, human-backed agents only · S
8. Agents hire Nigerians for real-world tasks
9. Human-verified reviews for buy services · S
10. Self-funding agent with a public P&L: earns over x402, pays its own API bills by vaulted card · V
11. Lunch agent: orders your usual on Chowdeck's website with your naira card; tops up data over x402 · V
12. Paid Telegram group bouncer: monthly pull payments through session keys · A
13. Crowdfunding that pays the hospital directly, not the patient's relative
14. Know-your-payee checks on Nigerian businesses (CAC) for payout agents
15. POS operators as USD₮ cash points for MiniPay users · C
16. Agent-to-agent naira P2P desk
17. Digital "spraying" at owambes
18. Campus data plug at Bowen
19. One budget, two rails: one agent pays x402 services and card-only websites under one limit · V
20. Creator deal escrow with the brand's budget as a session key · A, C
21. Football prediction leagues with paid entry
22. Fake-giveaway shield · S

## Step 2: Knockouts

| # | Out because |
|---|---|
| 7, 20 | Ads-Bazaar already does influencer marketing on Celo, and paid posting is under X's ban |
| 8 | AgentHands, Loopuman, HumanOracle and PerkyJobs |
| 9 | Crowded trust and reputation layer (fact 3) |
| 10 | No real user; the P&L would be ours |
| 11, 19 | Generic assistant job, nothing only-Celo about it |
| 12 | One pull per member inside the window |
| 13 | Needs a hospital's cooperation; sensitive campaign data |
| 14 | Scraping a government site |
| 15, 16 | Naira P2P and cash-point regulatory risk |
| 17 | Guests have no Celo wallets; December parties land after the deadline |
| 18 | AbaPay's lane (round 1 fact) |
| 21 | Paid entry makes it gambling; folded into Drop as free-entry, creator-funded contests |
| 22 | Folded into Drop as its Self layer |

**Survivors:** Drop, Admit, Detty arrival, Scout, Mini-import, Naira Router.

## Step 3: Scores (1–5)

Weights changed from round 1 to favour money that already moves and freshness: **Ship** by Sun 6 Dec from a phone (25) · **Money already moving** and users he can reach (25) · **Fresh** against Celo's seven 2026 agent hackathons and this event's field (20) · **Tracks**: fit, and survives one dependency failing (20) · **Demo** moment (10).

| Idea | Ship /25 | Money+users /25 | Fresh /20 | Tracks /20 | Demo /10 | **Total** | Tracks |
|---|---|---|---|---|---|---|---|
| Drop | 4 → 20 | 5 → 25 | 3 → 12 | 4 → 16 | 5 → 10 | **83** | Altana + Self |
| Admit | 2.5 → 12.5 | 2.5 → 12.5 | 5 → 20 | 4.5 → 18 | 5 → 10 | **73** | Agent Vault + Self |
| Detty arrival | 3 → 15 | 2 → 10 | 4 → 16 | 4 → 16 | 4 → 8 | **65** | Agent Vault + Self |
| Scout | 4 → 20 | 3 → 15 | 2.5 → 10 | 3 → 12 | 3 → 6 | **63** | Altana + Self |
| Mini-import | 2 → 10 | 3 → 15 | 4.5 → 18 | 3 → 12 | 4 → 8 | **63** | Agent Vault |
| Naira Router | 3.5 → 17.5 | 1.5 → 7.5 | 4 → 16 | 3.5 → 14 | 2.5 → 5 | **60** | Corridors |

Why Drop's money score is 5: giveaway money already leaves creators' pockets every week; Drop changes how it moves, not whether. Why its fresh score is only 3: fair draws exist (fact 4) and AbaPay airtime exists; the new part is the whole job together.

Why Admit's ship and money scores are low: browser automation on real university portals is fragile, file uploads need the Playwright SDK (the hosted MCP lists no upload tool), and it needs 2–3 real applicants paying fees with a dollar card before 6 Dec.

## Step 4: Hidden blockers

**Drop**
- **Altana admin flow (deciding).** Can a creator own a capped Altana wallet on Celo from a phone? The Celo setup uses a private-key admin, which can live in the creator's browser. Check at Wednesday's livestream.
- **Does the cap hold?** AbaPay pulls USD₮ by `transferFrom` after an approve. If Altana's spend limit doesn't count that pull, the cap has to come from an exact approve amount through a tiny Drop contract. Test with $1.
- **AbaPay from a smart account.** `payBill` from the creator's Altana wallet, tagged. Same $1 test.
- **Allowlist hole.** Altana allowlists contracts, not recipients, so the USD₮ token contract must never be on the session's allowlist (the agent could transfer anywhere). Only the AbaPay or Drop contract goes on it; the creator's admin key does the one-time approve.
- **Self layer needs passports.** Most Nigerian creators won't have one, so unverified hosts get a small cap per drop instead of a ban; verified hosts get a higher cap and a badge. His own e-passport is needed to register Drop's agent.
- **Entry abuse.** One entry per phone number and per X handle; bots need real SIMs. No X API, so "follow and retweet" rules stay the creator's to check, as today.
- **Privacy.** Only a hash of each phone number goes onchain; receipts mask numbers; numbers are deleted after payout.
- **Independent users are the creators.** He can't count his own drops. Needs 5–10 creators from his network.

**Admit**
- Real applicants with a working dollar card before 6 Dec (MiniPay Card is waitlist-only; Bitget and RedotPay cards exist).
- Portal fragility and file uploads (SDK, not hosted MCP).
- Agent Vault plan quotas (not documented in what was read).
- Passport number and date of birth aren't vault fields, so the agent would see them.
- Small onchain footprint, and DevRel's shortlist starts from onchain data.

## Step 5: 60-second story (Drop)

- **0–8 s:** Oh-Jay on camera: "Every Sunday on Nigerian X: giveaway, 20 people win ₦1,000 airtime. Every Monday: it was rigged." Cut to the drop page counting down.
- **8–20 s:** Real followers enter with phone numbers. The countdown hits zero: "Entries locked onchain" with the Celoscan link.
- **20–35 s:** Winners come from a block mined after the lock; a "recompute" button shows anyone can check. Twenty payouts go out; a winner's phone shows the MTN airtime SMS.
- **35–48 s:** The creator's screen: the agent's key can only buy airtime, only ₦20,000, only until 9:05 pm. The agent tries one more ₦1,000: the wallet refuses. The creator taps Revoke.
- **48–60 s:** A fresh account tries to host a ₦100,000 "giveaway": "Big drops need a verified human." Turned away. End card.

**Full loop, nothing faked:** creator funds their own Altana wallet from MiniPay → creates a drop and grants a session (cap, allowlist, expiry) → followers enter → entries lock onchain → draw from a later block → airtime paid through AbaPay from the creator's wallet, tagged → receipts page → revoke or expiry → weekly summary. Stretch: score-prediction contests settled from match results.

## Step 6: Against the bar

- **TesorerIA** (one group, weekly, every number linked): Drop has several creators weekly, each paying 10–30 people per drop.
- **Earmark** (AbaPay bills for families): same rail, different job and customer.
- **CeloRaffle, Celottery** (paid-ticket lotteries, fair draws): Drop has free entry, creator-funded prizes, and winners without wallets; fairness is one part, not the pitch.
- **Altana entrants seen** (Vex, tabline, caprail, ProcureYeti, vetgate): spend-cap tools for businesses and agents. Drop would be the consumer one with real money moving.

## Step 7: Recommendation

**Drop: Altana track, plus Self Agent ID if he has an e-passport.**

Why it beats Abeg:
- **Money already moving:** it takes over spending creators already do every week instead of asking for a new habit.
- **Public:** every drop is a public post, so each one advertises Drop.
- **Volume:** one creator pays 10–30 people per drop, which is the repeat, independent activity the traction query rewards.
- **Sponsor fit:** a key that can only buy airtime, only up to the budget, only until the drop ends is the clearest possible demo of a session key.
- **Second track:** the fake-giveaway problem gives Self a real job.
- **His world:** creators, X and Nigerian giveaway culture.

**Conditions (Wednesday night):** a creator can hold a capped Altana wallet on Celo from a phone; a $1 AbaPay payment from that wallet works and the cap holds.

**If Altana fails:** Drop still runs on a small capped Drop contract and competes in Self (passport needed). Without a passport either, switch to **Admit** (Agent Vault, the least-contested track, whose hosted cloud browser is documented).
