# Runsheet: Agents Open for Business (Celo × Loops House)

Read this first in every session. Update and push it before ending.

## Event
- Page: https://www.loops.house/agents-open-for-business (enroll: Enroll now on that page)
- Telegram: https://t.me/celoagenthackathons · Office hours Thursdays 12:00 GMT (13:00 WAT)
- Rules, tracks, judging: see `docs/hackathon/research.md` (sections 12–13 have the 26 Nov corrections and rivals)
- Brief (approved v2): `docs/brief.md`
- Repo: https://github.com/ohjay-official/preflight (public)
- Change-request route after submitting: not published yet (ask in Telegram if needed)

## Deadline (organiser time and Lagos time)
- **Submissions and registration close: Mon 7 Dec 2026, 09:00 GMT = 10:00 WAT**
- Winners: Fri 11 Dec 2026
- Time left at brief (Thu 26 Nov, 19:30 WAT): about 10 days 14 hours

## Backward checkpoints (WAT, reset 26 Nov for Preflight)
| Date | Checkpoint |
|---|---|
| Thu 26 Nov | Brief reviewed (him and the second assistant). He enrolls (terms screenshots first), creates `ohjay-official/preflight`, adds `ATTRIBUTION_CODE` secret |
| Fri 27 Nov | The five mainnet tests (brief.md): passkey admin from his phone; agent key read and revoke; tag through Altana via `verifyTx`; payer history source (Chainstack on buy vs Blockscout); x402 from Altana (or Hexbox's top-up pattern). Needs `VERCEL_TOKEN` in the morning |
| Sat 28 Nov | ERC-8004 registration from the agent wallet (tagged). PayTo registered. Live URL up. Checks 1–2 (identity, authority) |
| Sun 29 Nov | Checks 3–4 (payers, tags). x402 seller endpoint live |
| Mon 30 Nov 22:00 | **Scope lock (rule 11):** pay → check → report → revoke stops the agent, on the live URL. If not: cut hackathon mode; stats page becomes a README table printed by the verify command |
| Tue 1 Dec | Listed on buy, Altana Skills Registry submitted, one post each: event Telegram, Altana Telegram, his X |
| Wed 2 Dec | Traction check: under 5 outside payers means say so plainly in the submission |
| Thu 3 Dec | README top section, judges' guide and verify command done before AskBots round 2 |
| Fri 4 Dec | AskBots round 2 issues: fix them |
| Sat 5 Dec | Film recorded (his voice), named-user quote in hand |
| **Sun 6 Dec** | **Submit, a day early** |
| Mon 7 Dec 10:00 | Hard close |

## Target tracks
**Altana: Smart Agentic Wallets only** (26 Nov). Not entered: Corridors (self-paid cNGN wouldn't count), Agent Vault and Self Agent ID (he has no passport).

## Stage status
- [x] Stage 0: rules read, deadline math, capability check (24 Nov)
- [x] Stage 1 and 1 v2: research (24 Nov) → `research.md`; corrections 26 Nov in section 12
- [x] Stage 2 round 1: 25 ideas → `ideas-round1.md`. Abeg recommended; **rejected by him**
- [x] Stage 2 round 2: 22 ideas → `ideas.md`. Drop recommended; **rejected: not scalable**
- [x] Stage 2 round 3: Float → dropped after the second assistant's challenge (`reply-26nov.md`)
- [x] Stage 2 shortlist v2: Preflight recommended; second assistant agreed with the "trust check for any Celo agent" framing (26 Nov)
- [x] Live Keystore read on Celo passed (26 Nov, Celoscan): `getKeys`, `isValidKey`, `isRootKey`, `getExpiry` on a real wallet
- [x] Altana fee checked from real txs (26 Nov): wallets send about 10 CELO, about 9 kept, about 0.9 refunded. Fund about 10.5 CELO. CELO trades around 6–8 US cents (several exchanges, 26 Nov), so under $1
- [x] Stage 2 brief written → `brief.md` (26 Nov)
- [x] Stage 2 CHECK IN: brief v2 approved (27 Nov)
- [x] Enrolled on Loops House by email (27 Nov); attribution code stored as repo secret `ATTRIBUTION_CODE`; repo created
- [ ] Stage 3/4: build split (27 Nov). Second assistant (Grok Bot): scaffold PR, Vercel, read-only check engine, report UI, README. Claude: tests 1–4 (`scripts/tests/`, `docs/test-results.md`), Altana setup flow, session key wiring, x402 $0.02 gate, buy listing, fallbacks. Both work on branches and PRs; his manual steps go in `docs/oh-jay-todo.md`

## Session capabilities (24 Nov, still true 26 Nov)
- git over HTTPS works through the proxy; push needs the repo attached with push access (add_repo)
- **Package installs (npm, pip) are refused in this chat.** Builds and tests run in GitHub Actions; results go to a `<name>-results` branch. His network settings can allow installs; a new chat picks the change up
- **Bash can't reach Celo RPC** (forno.celo.org returns nothing). Onchain reads from this session go through the cloud browser on Celoscan; real reads run in CI
- Public repos clone fine over git (used for traction-check and buy-skill, 26 Nov); the GitHub API is blocked for repos not attached to the session
- Node 22, Python 3, ffmpeg available; no Solidity toolchain locally

## Decisions (dated)
- 24 Nov: no Contri rebuild; fresh ideas only (his call)
- 26 Nov: no passport and no recruiting: Self tracks and human-user ideas are out
- 26 Nov: Preflight, Altana track only; framed as a trust check for any Celo agent, with the hackathon checklist as the first use case
- 26 Nov: no 0–100 trust score (RNWY, QuickNode explorer and sentinel8004 already do that); verdict from fixed rules, no AI
- 26 Nov (v2, second assistant's point): he holds the admin key as a passkey on his phone and signs the revoke on camera; only the capped session key sits in Vercel. A phone wallet can't be the Altana admin (signer types: private key or passkey). Fallback: admin key generated in his phone's browser, never on the server
- 26 Nov (v2): no purchase is invented; the agent pays only for payment-history data the check needs (test 4), else the onchain receipt is its Altana action
- 26 Nov (v2): no emoji or tick icons in the UI; plain words and coloured status dots

## Open items
- HIS CALL: OK on `brief.md`
- His action: enroll on Loops House; screenshots of terms and form before ticking; leave PayTo blank if asked
- His action: create empty public repo `ohjay-official/preflight`
- His action: `ATTRIBUTION_CODE` GitHub secret (never in chat)
- His action, Fri 27 Nov morning: `VERCEL_TOKEN` secret
- His action, Fri 27 Nov: create the Altana wallet with his phone passkey on our admin page, then fund the address it shows with about 10.5 CELO + about $3 USDC from his exchange, never his personal wallet (mainnet; needs his OK)
- Mine: confirm on mainnet that the ERC-8004 reputation registry is on Celo (needed only if the onchain receipt becomes a must-have)
- Mine: watch for Celo's attribution dashboard going live

## Gate log
- 24 Nov: asked for fresh ideas, not Contri
- 24 Nov: said the first research pass wasn't my best; v2 done the same day
- 24 Nov: rejected Abeg ("you can do 100% way better"); round 2 done the same day
- 24 Nov: rejected Drop ("not scalable"); round 3 done the same day
- 26 Nov: shared a second assistant's review (verified rules, Float challenged, Market Pulse proposed); reply in `reply-26nov.md`: Float dropped, Market Pulse pressure-tested, human-backed panel recommended
- 26 Nov 16:40: shared shortlist v2 from the second assistant (constraints: no passport, can't recruit). Its pick, revocable naira subscriptions, was rejected by me: it needs outside sellers and outside Altana buyers. Recommended Preflight
- 26 Nov: second assistant backed Preflight with the trust-check framing and asked for two checks (public tag reads; overlap with the organisers' own tools). Live Keystore read passed; fee checked
- 26 Nov 18:48: second assistant questioned the CELO price; checked: it trades around 6–8 US cents, so 10.5 CELO is under $1. Brief written
- 26 Nov 18:59: second assistant's six points on the brief. Applied: admin key his (as passkey, since a phone wallet can't be admin), named and tested payer data source (test 4), no staged purchase, scope lock and film block in the brief (kept Mon 30 Nov, earlier than its Wed 2 Dec), sourced or dropped numbers (174 builders, 770 tools, FAQ quoted; "an hour by hand" dropped), no tick icons. Also found: 16 submissions; Errand Guard, AgentGuard, Hexbox, CapRail in or near our lane. Brief v2

## Rules from the build split (27 Nov)
- Never use GitHub or Google OAuth for anything (his ban)
- Never generate, hold or store an admin key or seed. Only the capped session key goes in Vercel env, and only once he creates it
- One agent wallet address for the whole event; entered at submit
- Joining a team changes the attribution code
- Site rules: no purple gradients, no pill buttons, no emoji icons, no fake counters, no vague hero text, no em dashes

## Next step
Claude: tests 1–4 in CI, `docs/test-results.md`, `docs/oh-jay-todo.md`; Altana setup page and x402 gate on top of the scaffold once it lands.
