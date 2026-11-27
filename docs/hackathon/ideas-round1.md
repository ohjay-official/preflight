# Stage 2: Ideas

Brainstormed 24 Nov 2026 after research v2. Contri and anything savings-circle related is excluded (his call). Scoring uses the event's own weights mapped onto the pipeline axes.

## Three facts that shaped the field (checked before brainstorming)

1. **cNGN on Celo has no consumer cash-out today.** Busha's API lists cNGN with deposits, withdrawals and ramps all "No", and Celo isn't one of its networks (docs.busha.io supported currencies). AbaPay takes only USD₮, USDC and USA₮ on Celo (AbaPay AGENT_GUIDE). So naira paid to an ordinary Nigerian in cNGN mostly sits in their wallet. Every Corridors entry paying cNGN to individuals has this weakness, including Arbolito.
2. **AbaPay is entered in this event.** Its README carries this hackathon's tag (`celo_7ed8773e529c`, from 21 Nov). It already sells Nigerian airtime, data, electricity and bank transfers to agents (x402, MCP, A2A), has a chat agent on Telegram, WhatsApp and X with onchain spending allowances and schedules, and gives Self-verified agents better terms. Nigerian bills are its lane.
3. **Passports are scarce at the bottom of the Nigerian market but normal among diaspora, travellers and people emigrating.** Self only reads passports for Nigerians, so Self-based ideas only work where the users already hold one.

Also from research: the naira payout and payroll lane holds about 15 entries plus a past winner; G$ ↔ cNGN is a Textile corridor but not one the track lists, and Owo already builds G$ spending in Nigeria.

## Step 1: Go wide (25 candidates)

Format: **who shows up → what they do → what they walk away with** · problem · solution · demo moment · tracks (C Corridors, V Agent Vault, S Self, A Altana)

1. **Family allowance.** A Nigerian earning in dollars sets weekly limits for Mum and siblings → they ask a chat bot for data, airtime, light or cash → it arrives in seconds, inside each person's limit. · Constant "abeg send me data" requests · per-person onchain allowance, agent fulfils requests · Mum's text, then the MTN SMS 10 s later; payer revokes one person and their next ask is refused · A
2. **Staff allowance desk.** A small-business owner gives each staff member a weekly data/airtime allowance → staff request by chat → owner stops being interrupted; revokes when someone leaves. · Same as 1, business version · A
3. **Shared plan collector.** The friend who pays the group's Spotify/ChatGPT/Netflix plan → each member taps once to let an agent collect their share monthly → shares arrive on the 1st, no chasing. · Chasing friends for subscription money · revocable pull payments · due date: shares land; a member leaves (revoke) and the next pull is refused onchain · A
4. **Diaspora home budget.** A Nigerian abroad funds one wallet → family requests bills and a caretaker's weekly wage → paid within a monthly cap. · Remote household management · bills + cNGN wage · A, C
5. **Exact-naira school fees from abroad.** · parent pays fees, school gets exact naira · C
6. **Best-route remittance.** · agent compares Textile, MiniPay pay-to-bank and P2P, then executes the best · C
7. **Freelancer naira payouts.** · C
8. **Importer supplier payments.** · C
9. **Naira-priced API for agents** (SMS, Nigerian data) · C, S
10. **GoodDollar UBI to airtime.** Nigerian G$ claimers convert idle G$ to airtime · C?
11. **Pay-as-you-ask AI.** A student or creator whose card can't pay $20/month → asks an AI agent for tasks at ₦50 each from a capped allowance → gets the work done; the agent buys its own compute on buy. · A (+S free tier)
12. **Pitch Gate.** A creator flooded by AI outreach → only human-backed agents can pitch, and they post a small bond → inbox gets real pitches, and the creator is paid for attention. · Self-gated x402; unverified agent turned away · S
13. **Fair giveaway.** One human, one prize · S, C
14. **Scholarship stipends to verified students** · S, C
15. **Data on credit per human** (Agent Tab) · S, A
16. **Know-your-agent bills desk** · S
17. **Foreign exam/application fee payer** via Agent Vault · V, C
18. **SaaS seat manager + share collector** via Agent Vault · V, A
19. **Build-at-home milestone escrow.** Diaspora funding a building project → AI checks site photos and receipts → releases each tranche within a cap. · A, C
20. **Inspection-fee escrow for Lagos house hunting** · A
21. **Digital "spraying" at December parties** · none
22. **December shortlet cost splitter** · C?
23. **Vendor checkout with no fake alerts** · none
24. **Team agent cards.** A small dev team → each teammate's coding agent gets an onchain card to pay x402 services → per-person caps; revoke when someone leaves. · A
25. **Salary autopilot.** USD₮ lands → the agent splits it by rules · A

## Step 2: Bolder rewrites (the 8 most generic)

- **1 → "Abeg":** "Your family stops asking you; they ask the agent." Every relative gets their own onchain card with a weekly limit that the chain enforces even if our server is hacked; data, light and cash arrive in seconds; you get a Sunday summary; one tap stops any card.
- **3 → "Split":** direct debit for stablecoin wallets. The first real "cancel subscription" button in crypto: leave the plan and the agent physically can't take your share.
- **4 → folded into 1** as the diaspora version of the payer.
- **6 → "Which way pays Mum more":** the agent quotes every route live and admits when the onchain one loses.
- **11 → "Ask, ₦50":** an agent that pays its own way per task from a ₦2,000 weekly allowance you set.
- **12 → "Reply Bond":** pitch me through your agent; if I reply, you get your bond back.
- **19 → "Milestone":** the contractor sends a roof photo, the agent checks it against the plan, and the next ₦ tranche releases.
- **24 → "Agent cards":** Ramp-style expense cards, but for the AI agents on your team.

## Step 3: Knockouts

| # | Out because |
|---|---|
| 5, 6, 22 | Recipient can't use cNGN (fact 1); 5 overlaps Earmark |
| 7, 8 | Most crowded lane (about 15 entries plus Arbolito); 8 has no users in reach |
| 9 | Our own service receiving cNGN isn't "an outside recipient"; needs a naira-billed backend |
| 10 | G$ isn't a listed corridor; Owo is already building G$ spending in Nigeria; G$ amounts are tiny against Textile's $1 minimum |
| 13 | bearproof is already doing "one human, one prize" here; entrants need passports |
| 14, 15 | Recipients need passports (fact 3); 15 lends our own money to strangers |
| 16 | AbaPay already does exactly this, in this event (fact 2) |
| 17 | Needs a funded dollar card, a browser agent run from a phone, and payment-agent risk |
| 18 | Bot-protected sites plus browser automation without a laptop |
| 20, 21, 23 | No realistic onchain users in the window: Nigerians pay each other by instant bank transfer |
| 25 | Close to RemitRoute's winning entry; one user per setup |
| 2 | Kept as a variant of 1 |
| 4 | Merged into 1 |
| 19 | Kept for scoring, but no real building project can run in 12 days |

**Survivors:** 1 Abeg, 3 Split, 11 Ask ₦50, 12 Reply Bond, 24 Agent cards, plus 4 (best Corridors shape) for comparison.

## Step 4: Scores (1–5)

Axes mapped from the event's 25/25/25/25 criteria, with "can ship" held at 30: **Ship** from a phone by 6 Dec (30) · **Value** clear in two sentences (20) · **Traction**: independent users with repeat use by 6 Dec (20) · **Named user** and real job (15) · **Native + original**: only makes sense on the sponsor's tech; beats what exists (15).

| Idea | Ship /30 | Value /20 | Traction /20 | Named /15 | Native+orig /15 | **Total** | Track |
|---|---|---|---|---|---|---|---|
| 1 Abeg (family allowance) | 4 → 24 | 5 → 20 | 4 → 16 | 5 → 15 | 3 → 9 | **84** | Altana |
| 3 Split (shared plans) | 4 → 24 | 4 → 16 | 2 → 8 | 4 → 12 | 5 → 15 | **75** | Altana |
| 11 Ask ₦50 | 4 → 24 | 4 → 16 | 3 → 12 | 3 → 9 | 3 → 9 | **70** | Altana |
| 24 Agent cards | 4 → 24 | 3 → 12 | 3 → 12 | 2 → 6 | 4 → 12 | **66** | Altana |
| 4 Diaspora budget (Corridors) | 3 → 18 | 4 → 16 | 2 → 8 | 4 → 12 | 3 → 9 | **63** | Altana, Corridors |
| 12 Reply Bond | 3 → 18 | 4 → 16 | 1 → 4 | 2 → 6 | 5 → 15 | **59** | Self |

Reply Bond would score higher under Self's own weights (integration 30, innovation 30), but it needs his passport and real human-backed outreach agents, which barely exist yet.

Why Abeg's traction scores 4: the relatives need no wallet (the agent pays for them), so only payers onboard, and they're his audience. Requests come several times a week, which is the "repeat use" the judges weigh most. Its originality scores 3 because AbaPay already lets a wallet owner schedule airtime for any number. Abeg's difference is that the people asking aren't the person paying, and each has their own limit.

## Step 5: Hidden blockers in the top 3

**1 Abeg**
- **Altana on Celo (deciding).** Can an ordinary payer create and own an Altana wallet on Celo from a phone? The passkey guides are BNB-first, and the Celo setup uses a private-key admin. Check at Wednesday's livestream and in Altana's Telegram. **Go or no-go Wednesday night.**
- **Paying AbaPay from a smart account.** Use AbaPay's contract `payBill` (a tagged transaction from the Altana wallet), not x402, because x402 settlements carry no tag and wouldn't count for us. Test with $1 before building around it.
- **Recipient lock.** Altana allowlists contracts only, not who receives a token transfer. Bills are safe (only the AbaPay contract is allowed). Cash allowances would need a small router contract that only pays each relative's registered wallet, or we drop cash.
- **Channel.** Telegram is easy from a phone. WhatsApp needs Meta approval, so it's out for this window.
- **Independent users.** His own family with him as payer doesn't count. We need 5–10 payers from his audience.

**3 Split**
- Every member needs their own Altana wallet funded with USD₮: the Altana risk multiplied by every member.
- Monthly cadence gives only one pull per member inside the window.

**11 Ask ₦50**
- Needs LLM inference on buy and a pricing that covers it.
- Looks like a reseller unless the tasks are distinctly Nigerian.

## Step 6: 60-second story (Abeg)

- 0–8 s: "Every Nigerian earning in dollars knows this text: *abeg send me data*." Mum's Telegram: "data don finish" → 6 s later, the MTN SMS lands.
- 8–25 s: The payer's screen shows Mum ₦5,000 a week and Tunde ₦3,000 a week, each a real onchain card with a limit and an expiry; tap through to Celoscan.
- 25–40 s: Tunde asks for ₦5,000 airtime → "₦1,200 left this week" → the limit is enforced by the chain, not by us.
- 40–52 s: The payer taps Stop on Tunde's card (one transaction) → Tunde asks again → refused.
- 52–60 s: The Sunday summary, then "Try it".

**Full loop, nothing faked:** payer funds → per-person cards granted → relatives ask by chat → agent pays the real bill (AbaPay contract) → receipt to both → limits enforced → revoke → weekly summary.

**Against the bar:**
- TesorerIA (one real group, weekly, every number linked): achievable.
- Earmark (bills through AbaPay, Nigerian families): same rail, different job.
- AbaPay (owner-scheduled bills): our job differs.
- Adelanto (rules plus a verify script): achievable.
- No past Altana winners exist to compare against.

## Step 7: Recommendation

**Abeg, Altana track.** It has the strongest real-user story, the demo moment a tired judge remembers, and traction mechanics that suit his reach. It's one track only. Corridors and Self don't fit honestly: AbaPay doesn't take cNGN, and relatives don't run agents.

**Conditions:** Altana confirmed workable for real payers on Celo (Wednesday), and a $1 AbaPay contract payment from an Altana session working.

**Fallback if Altana fails Wednesday:** if he has an e-passport, pivot to Reply Bond (Self). If not, pick from the Corridors shapes knowing the cNGN weakness.
