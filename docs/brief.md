# Brief: Preflight

Stage 2 output. Written 26 Nov 2026, 19:30 WAT; v2 at 20:30 WAT after the second assistant's six points. Status: **approved by Oh-Jay, 27 Nov 2026.** This file is the source of truth for the build.

## One-Liner

Before your agent pays another agent, or plugs one into its workflow, Preflight checks three things on Celo: is it who it says it is, can its spending be stopped, and has anyone real paid it?

In plain words: it's like checking a mechanic before you hand over your car keys. Is the shop registered? Can the owner take the keys back if something goes wrong? Do real customers come back, or is it only his cousins?

## The Problem and Who Has It

- **Agents are starting to hire agents on Celo.** buy lists 770 tools ([usebuy.ai](https://usebuy.ai), read 26 Nov). Altana's own idea list for this event includes "an agent that hires other agents." Before paying, the hiring agent has no quick way to tell a real business from a wallet that pays itself.
- **The facts exist but are scattered.** Identity sits in the ERC-8004 registry, spending authority in Altana's Keystore, and payments in token transfer logs. Today it takes three tools and hand-tracing on Celoscan to put them together.
- **First people with this problem: the builders in this event.** 174 builders are registered ([Loops House results page](https://www.loops.house/agents-open-for-business/winners), read 26 Nov), and every entry has to prove some of the same things: ERC-8004 registration for all, a live and revocable Altana key for the Altana track, and payments from independent wallets for traction. Today they find out where they stand only after judging.

## What It Does

You send an agent ID or a wallet address. You get back a report, as JSON for agents and as a page for humans:

1. **Who is it?** Registered on ERC-8004? Registered from its own wallet? Does its agent card load?
2. **Can it be stopped?** Is it an Altana wallet? Each agent key is shown as live, revoked or expired, with its expiry date. Spending limits are shown if they can be read onchain; if not, the report says "limits set" without amounts.
3. **Has anyone real paid it?** Payments into its wallet over the last 30 days: how many wallets paid, how many have no funding link to the agent or its owner (one hop back), and payments it made to itself, flagged.
4. **Hackathon mode:** what share of its transactions carry an attribution tag, and which code.

Verdict: **OK to pay**, **small amounts only** or **don't pay**, each with the reasons. Fixed rules, so the same agent always gets the same answer. No AI decides the verdict.

Honest wording rule: the report says "no funding link found", never "independent". A team can route funds through an exchange, and one hop won't see that.

## How It Earns, and Why It Runs on Altana

- **Price:** $0.02 per check, in USDC or USD₮ on Celo over x402. Listed on buy. Humans on the website get 3 free checks a day; agents pay.
- **Preflight's own agent runs from an Altana smart agentic wallet** under a session key with a spend cap, an expiry and an allowlist. Payments come into that same wallet (our PayTo).
- **It buys only data the check really needs.** The "has anyone real paid it" check needs 30 days of incoming payments and where each payer's money came from. If test 4 shows that Chainstack's archive Celo RPC on buy ($0.01 a request, up to 2,000 calls batched) can pull that, the agent pays for it out of its own earnings, inside the cap: "pays its own way over x402 inside that cap", in the track's words. If a free indexer turns out better, we use it and invent no purchase.
- **Who holds what.** He holds the admin key: a passkey on his phone, so he signs the revoke himself, on camera. Only the capped session key lives on the server, as a Vercel secret. A phone wallet like MetaMask can't be the admin, because Altana's signer types are a private key or a passkey only ([docs](https://docs.altana.network/use-cases/7-onboard-from-browser-wallets)).
- **Sponsor-native, in one sentence:** Preflight's core check reads Altana's Keystore on Celo for live, revoked and expired agent keys, and Preflight itself runs under a capped, revocable Altana session; without Altana, there is no spending authority to check and no revoke to show.

## Target Track and Its Bar

**Altana: Smart Agentic Wallets only.** $750 + 25,000 XP first, $250 + 10,000 XP second. Judged 25% each on execution, value proposition, traction and named user.

| Requirement | How Preflight meets it |
|---|---|
| Agent acts from an Altana wallet on mainnet | Its own agent wallet is Altana. It receives payments there and pays for the data it needs from there |
| A session key with cap, allowlist or expiry, shown in the demo | Cap on USDC, expiry about 10 days out, allowlist locked to one method on one contract (`to` + `signature`) |
| Demo shows a revoke transaction and the agent stopped | He signs Revoke with his phone's passkey. Preflight checks itself, shows "revoked", and refuses the next paid job. The customer isn't charged |
| ERC-8004 | Registered from the agent wallet, with the tag |

Not entered: Corridors, Agent Vault and Self Agent ID. The last two need a passport. For Corridors, paying ourselves in cNGN wouldn't count.

## Money Shot (First 10 Seconds of the Film)

A phone screen. An agent ID is pasted in, and a report comes back in plain words, each line with a coloured status dot (green, amber or red), no emoji or tick icons:

- Identity: **Registered**
- Spending key: **Live**, expires 6 Dec
- Payers: **7 wallets**, 5 with no funding link to the owner
- Verdict: **OK to pay**

## 60-Second Demo Story

- **0–10 s:** An agent is about to pay another agent for a job. It calls Preflight first. The report is on screen.
- **10–25 s:** The three answers, each a tap through to the transaction on Celoscan.
- **25–40 s:** Preflight runs on Altana too: its own agent key with a cap and expiry, and the paid data calls it made for this report, with links.
- **40–55 s:** He signs Revoke on Preflight's own agent key with his phone's passkey. One transaction. Preflight checks itself: **revoked, don't pay**. A new paid request comes in, the agent refuses to spend, and the customer isn't charged.
- **55–60 s:** It's live on buy. The stats page shows outside agents and repeat checks this week.

## Must-Haves (Happy Path Only)

1. An Altana agent wallet on Celo mainnet, with his phone passkey as admin and a session key (cap, expiry, allowlist) whose private half lives only in Vercel. Registered on ERC-8004 from that wallet, with every transaction tagged.
2. A check engine with the four checks above, using onchain reads plus the payment-history source test 4 picks, and fixed rules.
3. An x402 seller endpoint priced in USDC and USD₮ on Celo, settling only when the check completes. PayTo registered before the first sale.
4. If test 4 picks a paid source: the agent pays for that data inside its Altana cap, and every report lists its own paid calls with transaction links.
5. A report page that works on a phone, plus a stats page that labels every wallet as ours or outside (Adelanto's transparency pattern).
6. Revoke: he signs it with his passkey in one transaction, and the agent then stops spending.
7. Distribution: a buy listing (a GitHub issue on celo-org/buy-skill), a submission to Altana's Skills Registry, and an agent card at `/agent.json`.
8. A README with a judges' guide and a single verify command that rebuilds every count from the chain.

## Cut List (Deliberately Not Building)

- No single trust score out of 100. RNWY, QuickNode's ERC-8004 explorer and sentinel8004 already score agents, so we'd lose that fight. We win only on authority and payers.
- No AI-written verdicts or summaries.
- No other chains. Celo only.
- No check of Loops House enrollment (not public) and no mapping from code to project (that sits with Celo's indexer).
- No Self, Agent Vault, Textile or mini app.
- No custom smart contracts, unless the onchain receipt below becomes a must-have.
- **Stretch only:** when an agent pays to check itself, write the result to its ERC-8004 record from our Altana wallet, so the pass shows up on explorers people already use. This becomes a must-have only if test 4 below picks the free indexer, because then the agent buys nothing and needs another real Altana action.

## How a Judge Tests It in 30 Seconds

1. Open the live URL on a phone.
2. Tap one of the example agents (Preflight itself, and one outside agent), or paste any Celo agent ID.
3. Read the report, then tap any line to see its transaction.
4. To test as an agent, run one `buy` command; it's in the README.

## The Five Tests That Decide It (Fri 27 Nov, on Mainnet)

The Keystore read already passed on a real wallet (26 Nov): `getKeys`, `isValidKey`, `isRootKey` and `getExpiry` all work.

1. **He can be the admin from his phone.** Create the Altana wallet with a passkey on his phone, and grant a session to a key the server generated, so the session's private half never leaves Vercel. Errand (another entrant) reports passkey wallet creation working live on Celo. Fallback: an admin key generated inside his phone's browser on our admin page, never sent to the server, with its backup written on paper.
2. **The agent key reads right.** Read our session back from the Keystore: `isRootKey` false, `getExpiry` above 0, and see what `getMetadata` returns. Then revoke it and read again.
3. **The tag survives Altana.** Altana puts its ERC-8021 tag at the end of the inner call, not the outer transaction. Run one tagged `execute` through Celo's `verifyTx`. This is a live question: Errand built Altana granting and switched it off "until Altana confirms how grant/revoke transactions can carry the attribution tag" (its Loops House page, 26 Nov).
4. **The payer check can be built.** Pull 30 days of USDC and USD₮ payments into one real agent wallet, plus the first funding transfer of each payer. First try Chainstack's archive Celo RPC on buy, with batched `eth_getLogs` (Errand and Traction-Check already pay for it on Celo). Fallback: Blockscout's API, where Celo is on the free tier ([Blockscout docs](https://docs.blockscout.com/devs/plans-and-credits)). One known gap: plain CELO sends leave no Transfer log, so a funding link made in CELO only shows up through the indexer. Pass means the right payers come back in under 10 seconds for under $0.05.
5. **The agent can pay x402 from Altana on Celo.** Altana's own x402 signs as a smart wallet (ERC-1271), and its docs show this on BNB, Base and Ethereum, not Celo. Fallback already working on Celo mainnet: Hexbox (another Altana entrant) has its session key send USDC, inside the cap, to a small spending wallet that pays x402, and the session can call nothing else (its Loops House page, 26 Nov).

If test 4 picks the free indexer, nothing is bought and the agent's Altana action becomes the onchain receipt instead. If test 3 fails, our traction still counts through the PayTo registration, and we ask in the Altana and Celo Telegrams.

## Scope Lock and Schedule

- **Scope lock: Mon 30 Nov, 22:00 WAT.** If pay → check → report → revoke-stops-the-agent isn't working on the live URL by then, hackathon mode is cut, and the stats page becomes a table that the verify command prints into the README. Monday, not Wednesday, because outside agents need about five days to find us and come back, and the buy listing goes out Tue 1 Dec.
- **Fixed blocks, not leftover time:** Thu 3 Dec README and judges' guide; Fri 4 Dec AskBots fixes; **Sat 5 Dec film (his voice) and the named-user quote**; Sun 6 Dec submit.

## Proof Plan

- **Who pays:** other teams' agents. The event FAQ, word for word: "An agent wallet with its own ERC-8004 identity, registered by a different team, also counts when it pays you" (event page, read 26 Nov). The rules also say "paid calls on buy from your agent count in your favour as real use", so checking with Preflight once we're listed helps their own score too.
- **Where they find it:** the buy listing, Altana's Skills Registry, and one post each in the event Telegram, Altana's Telegram and his X. No DMs and no onboarding.
- **First targets:** the Altana-track entries already submitted (AgentGuard, Hexbox's Spendguard Scout, CapRail; Errand has Altana built but switched off), plus the other Altana wallets on the Keystore. Every one of them has to demo a revoke, and Preflight is a neutral check that it worked. AgentGuard's page says it has no independent user yet (26 Nov), so these teams are short of real activity too.
- **Targets by Sun 6 Dec:** at least 10 outside agent wallets paid, at least 3 came back more than once, and 1 named builder who says what it saved them, quoted with their permission.
- **The bar to beat:** Traction-Check won Open Rails' buy track. Every report listed its paid calls, a stats page counted everything, and its README shows one independent paying wallet. Preflight matches the first two and aims for ten times the third.

## Risks

| Risk | What we do |
|---|---|
| Passkey admin fails on Celo (test 1) | Admin key made in his phone's browser, never on the server; backup on paper |
| The payer check can't be built cheaply (test 4) | Free indexer instead; if that fails too, cut payers to "last 50 payments" and say so on the report |
| Altana's own x402 doesn't work on Celo (test 5) | Hexbox's pattern: the session tops up a small spending wallet inside the cap |
| Celo's checker misses Altana's tag (test 3) | PayTo inflows still count. Raise it in the Altana and Celo Telegrams |
| Errand Guard sells a $0.01 "check before you pay" API to agents (Self-gated) | It checks the payment (amount, recipient, balance). Preflight checks who you're paying: their authority and their payers. The pitch says so in one line |
| Every Altana entry so far is "my agent buys data under a cap" | That's the crowd's shape. Preflight is the only one that serves the other agents, which is our angle with Altana's judges |
| Fewer than 10 outside agents pay | Pitch it as "a paid buy call that also counts for you", price it at $0.02, and post in three places. If it's under 5 by Wed 2 Dec, say so plainly in the submission |
| Read as a hackathon-only tool | Lead the pitch and the README with "before you pay an agent". The event is only the first customer group |
| Generic agent scores already exist (RNWY, QuickNode explorer) | Don't score. Show authority and payers, which they don't |
| Celo publishes its own tag dashboard before 7 Dec | That overlaps hackathon mode only. The core checks stand |
| New buy listings are marked experimental, and agents are told to confirm with their user before paying | Builders are the users, and the post tells them what they're paying for |
| Traction-Check overlap | Checked 26 Nov: it scores a project's X buzz and token wash trading for humans, not agents' authority or payers. Low overlap |

## What Only He Can Do

1. Enroll on Loops House. Send screenshots of the terms and the form before ticking anything. If the form asks for a PayTo address, leave it blank for now; our agent wallet doesn't exist yet, and the FAQ allows adding it before the first sale.
2. Create the empty public repo `ohjay-official/preflight`.
3. Put the attribution code into a GitHub secret named `ATTRIBUTION_CODE` (never in chat).
4. Friday morning: add a `VERCEL_TOKEN` secret (same steps as Contri). The passkey admin page has to be live on HTTPS before test 1.
5. Friday: on that page, create the wallet with your phone's passkey, then fund the address it shows with about 10.5 CELO plus about $3 in USDC, sent from your exchange, never from your personal wallet. Check the naira price first. This needs your OK, because it's mainnet money.

## Sources (checked 24–26 Nov 2026)

- Event rules and FAQ: loops.house/agents-open-for-business (read in browser 26 Nov; FAQ quote copied word for word)
- Builder and submission counts, rival entries (Errand, AgentGuard, Hexbox, CapRail): loops.house/agents-open-for-business/winners and their project pages (26 Nov)
- buy catalogue size and Chainstack price: usebuy.ai (26 Nov)
- Altana sessions, x402, attribution, signers, grantSession: docs.altana.network (/concepts/sessions, /sdk/x402, /use-cases/6-agent-pays-api-x402, /use-cases/7-onboard-from-browser-wallets, /sdk/grant-session, /sdk/attribution, /llms.txt)
- Blockscout free tier for Celo: docs.blockscout.com/devs/plans-and-credits
- Keystore reads on Celo: celoscan.io, contract 0x83b30935f36d6ccf9B1ec3b5E47F2866b97cd27c (read 26 Nov)
- buy listing rules: github.com/celo-org/buy-skill (registry/README.md, registry/LISTING.md)
- Traction-Check: github.com/Truthgeng/traction-check README
- Existing agent scores: rnwy.com/explorer, erc-8004.quicknode.com
