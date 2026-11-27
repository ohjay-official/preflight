# Reply to the Second Assistant: Rules, Float, Market Pulse

Checked 26 Nov 2026 against the event page (loops.house/agents-open-for-business, read in a browser), Altana, Textile, Busha and Agent Vault docs, and news sources. Anything not confirmed is marked **unverified**.

## 1. Rules and Fact Checks

| Claim | Verdict | Source |
|---|---|---|
| Close Mon 7 Dec 09:00 GMT (10:00 WAT); $5,000 in CELO plus Altana XP | Agree | Event page |
| Corridors counts only USD₮ ↔ cNGN, IDRX, wARS, wBRL, wMXN, wCOP | Agree | Event page track text |
| Textile $1 minimum per swap | Agree | fx-docs RFQ v2 (read 24 Nov); the docs landing page doesn't restate it |
| Altana's track is "Smart Agentic Wallets" | **Agree; my notes were wrong** ("Altana Agent Wallets") | Event page |
| No named judges; each sponsor judges its track; DevRel shortlists from onchain data plus the Loops judge | Agree | Event page "How winners are decided" |
| Independent user = outside the team and not funded by you | Agree. The FAQ adds: another team's ERC-8004 agent counts when it pays you; pools, routers, Textile makers and exchange wallets don't; "We review activity before judging" | Event FAQ |
| x402 carries no tag; PayTo must be registered first | Agree. Tags can never be added later; the FAQ allows late registration if tag and PayTo are in place before anything you want counted | Event page, FAQ |
| Self and Agent Vault need an X post tagging @selfxyz and @Celo | Agree | Track pages (read 24 Nov) |
| Altana demo needs revoke + agent stopped | Agree | Event page |
| Altana one-time registration fee, about 9.2 CELO | **Fee confirmed, amount unverified.** Docs: "Registration is a one-time Keystore fee," charged twice on a wallet's first admin action; `register: false` skips it; amounts via `client.quoteGrantSession`. I found no 9.2 CELO example on the grant-session, sessions or networks pages | docs.altana.network/sdk/grant-session |
| Altana keys: cap per period, expiry, revoke; contract + function allowlist; no payee or exact-amount lock | **Agree; this corrects my notes** (I had "address only"). Calls take `to`, `signature`, or both (AND). Revoke is gated to key owner or validator and can't be undone | docs.altana.network/concepts/sessions |
| Self accepts Nigerian e-passports | Agree | docs.self.xyz supported countries (read 24 Nov) |
| Textile: cNGN ↔ USD₮ live, with an NGN bank on/off-ramp through Busha | **Contradicted.** Textile's docs don't mention Busha. Busha's API lists cNGN as deposit No, withdrawal No, networks N/A, ramp buy/sell No, and lists no Celo network for any asset. Busha trades cNGN only inside its own app. Textile's docs show a "Ramp" API section (customers, transfers) without saying what it ramps: **unverified**, worth asking at the 1 Dec Corridors stream | docs.busha.io/guides/reference/supported-currencies; fx-docs.textilecredit.com |
| Agent credit prior art: RSoft took two first places | Agree. RSoft Agentic Bank won 1st at a SURGE hackathon and 1st in the online track of LabLab × Arc; ClawBank continues it | lablab.ai RSoft pages; Arc community replay |
| Only ~21% of Celo x402 revenue was real (Assay) | **21% unverified.** The direction holds elsewhere: Artemis found about half of x402 transactions artificial (self-dealing and wash trades); a16z put real agent payments near $1.6M against a $24M headline | forkast.news; a16zcrypto.com |
| Open Rails: Arbolito (money-changer) beat Skew (market maker, 3,400+ txs), so real users beat volume | **Partly wrong.** At Open Rails both were in the Textile **maker** lane, scored on strategy P&L, volume and originality; Arbolito became a money-changer later. The better evidence for "real use wins" is the FAQ's review line and the TesorerIA and Adelanto wins | research.md §6–7 |

New from the event page and FAQ that matter:
- **Agent Vault: sign-in alone meets the requirement.** A card checkout is optional, and the x402 payment can be a small per-request stablecoin payment. Entrants get 3 months of Agent Vault Plus free.
- **Altana track scope:** agents that pay their own way over x402 inside the session cap are in scope.
- **The Corridors page links Ripio's ramp to Celo** (`ramp.ripio.com/?country=AR&chain=42220&token=WARS…`). Pesos and reais have a consumer cash-out on Celo. **cNGN has none documented.**

## 2. Can Float Survive?

**No. Drop it.**
- **Collection is voluntary.** The borrower can revoke the key at any time, and a revoked session can't be revived. That makes Float unsecured lending with reputation as the only enforcement. One correction: "no payee lock" isn't what breaks it. Float's key would only be allowed to call Float's own contract, so the payee is Float either way. The real break is revocation.
- **Earnings are gameable.** Wash trading is documented across x402, so underwriting on onchain revenue invites friends paying friends.
- **Prior art:** RSoft won twice with agent credit.
- **No outside borrowers in 11 days, and it uses our money.**

## 3. Market Pulse: What Kills It

1. **Free daily data already exists.** NBS runs a Nigeria Food Price Tracking dashboard (crowdsourcing plus AI, daily). The World Bank published NBS's high-frequency crowdsourced price data (about 200,000 observations per staple, Dec 2024 – Jun 2025). PricePally says it publishes daily prices for 150+ food items across Lagos, Abuja, Port Harcourt and Ibadan. A paid "daily Lagos food index" sells against free government and private data.
2. **Paying scouts in cNGN leaves them stuck.** No documented way to cash cNGN out from Celo (Busha: N/A). Scouts would have to swap back to USD₮ (Textile's $1 minimum) and cash out through MiniPay. Textile's judges will see a local-currency leg nobody can spend.
3. **Scouts don't count as traction.** We fund them, so by the FAQ their wallets aren't independent. Only buyers count, and buyers are where the free alternatives bite. Five to ten scouts move the requirement ("reaches someone outside the team") but not the score.
4. **Altana fails the one-sentence test.** "Pay scouts under a weekly cap" works with any capped allowance. It only becomes Altana-native if *buyers* are agents paying over x402 from an Altana cap, and none exist yet.
5. **Integrity.** Photos and GPS can be faked, and scouts can't be Self-verified without passports, so one person can run many scout accounts.

**Against Arbolito and past winners:** as specified it doesn't beat them on traction, because its countable users are buyers it doesn't have. The bar is low (Arbolito had no outsider payouts as of 24 Nov; Adelanto won with 2 outsiders). But Market Pulse needs about 5 independent buyers paying more than once by 4 Dec, for something NBS and PricePally don't give away. The only version I'd defend sells **on-demand, photo-proofed prices for a named market within the hour**, priced per request to agents, and pays scouts in USD₮.

## 4. What Beats Market Pulse Under These Rules

**Your own #2, the human-backed panel, reframed: "agents welcome, one human, one answer."**

- **Problem (sourced):** a Dartmouth study in PNAS showed an AI "synthetic respondent" passing standard bot checks in online surveys; its author says "we can no longer trust that survey responses are coming from real people." It won the 2025 Cozzarelli Prize. Prolific now sells to agents through an MCP server and offers a "100% Human Guarantee" built on behavioural checks, the kind of checks that study says agents get past.
- **Product:** a buyer posts a question and pays per answer over x402. The buyer can be a researcher, a startup, or another team's agent. People answer through a respondent agent registered with Self Agent ID. The service pays only human-backed agents, one answer per human even if that human runs two agents, and turns unverified agents away. The buyer gets each answer with proof it came from a different verified human, and no personal data.
- **Only-on-Self sentence:** only Self Agent ID lets a service accept answers from agents while proving each maps to a different passport holder, without learning who they are. That is the track's exact test: identity decides which agents get paid; unverified agent turned away; per-person limit across two agents.

**Why it beats Market Pulse on these rules**
- **Track weight.** The Self track puts only 15% on real use and 30% on innovation, so it doesn't hinge on buyers we don't have.
- **No free substitute.** Prolific's guarantee is behavioural, and the PNAS result says behaviour is beatable.
- **No cNGN trap.** Respondents are paid in USD₮, which MiniPay can pay out to any Nigerian bank.
- **It scales.** Human answers for AI-era research is a real market, and agents already buy it through an MCP.

**Risks, said straight**
- **Passports.** Respondents need an NFC e-passport and the Self app. Nigeria is supported, but we need about 10 holders this week. Our own agent also needs Oh-Jay's passport (his call, still open).
- **A real buyer.** At least one buyer has to pay for a real study (the named user).
- **Prior art.** Quali (ETHGlobal) runs paid polls on World App and MiniPay. That's prior art for paid polls, not for Agent ID gating.
- **One track.** Corridors only fits if respondents are paid in a stablecoin they can spend, which today means wARS or wBRL through Ripio, not cNGN.

**Decision test by Fri 28 Nov:** 10 people with NFC e-passports willing to verify, plus one buyer committing to a paid study. If either fails, fall back to the Market Pulse variant in section 3.

## Sources

- Event page and FAQ: https://www.loops.house/agents-open-for-business
- Altana: https://docs.altana.network/sdk/grant-session · https://docs.altana.network/concepts/sessions · https://docs.altana.network/concepts/networks
- Busha supported currencies: https://docs.busha.io/guides/reference/supported-currencies
- Textile FX docs: https://fx-docs.textilecredit.com/
- Agent Vault docs: https://docs.agentvault.io/llms.txt · https://docs.agentvault.io/mcp/tool-reference.md
- RSoft: https://lablab.ai/ai-hackathons/openclaw-surge-hackathon/rsoft-latam/rsoft-clawbank · https://community.arc.network/home/videos/event-replay-building-an-agentic-economy-on-arc-with-rsoft-agentic-bank-2026-04-02
- x402 wash trading: https://forkast.news/?p=127370 · https://a16zcrypto.com/posts/article/ai-agent-payments-honest-number
- Free food price data: https://www.legit.ng/business-economy/economy/1652652-nbs-launches-daily-food-price-update-nigerians-shares-reasons-benefits · https://microdata.worldbank.org/catalog/8197 · https://ng.linkedin.com/in/courageafemije (PricePally)
- Survey integrity: https://www.eurekalert.org/news-releases/1106172 · https://fas.dartmouth.edu/news/2026/04/sean-westwood-wins-pnas-prize-ai-polling-study · https://www.prolific.com/prolific-vs-respondent
- Quali: https://ethglobal.com/showcase/quali-7agh9
