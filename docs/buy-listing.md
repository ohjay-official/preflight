# buy Listing: Draft

Not filed. Filing publishes this text on `celo-org/buy-skill` under Oh-Jay's GitHub account, so it needs his yes first.

**When it can be filed:** after `/api/v1/check` answers `402` on the production URL. That needs the agent wallet granted (`docs/oh-jay-todo.md`, step 3) plus `PAYTO_ADDRESS` and `X402_API_KEY` in Vercel.

**Before filing:**
- Run buy's own free check, which signs nothing: `npx --yes @celo/buy quote 'https://<production host>/api/v1/check?address=0x...'`. It must show USDC and USDT offers on Celo that buy can pay.
- buy's maintainers want a terms and support page that says where a buyer goes when a paid call fails. The draft points at the repo's Issues until the site has a page for this (Grok Bot's UI).

**How to file:** either a pull request adding `registry/providers/preflight/agent-check/PAY.md`, or the "List your service" form (https://github.com/celo-org/buy-skill/issues/new?template=list-your-service.yml) with the same text. Format: `registry/LISTING.md` in that repo, read 27 Nov 2026.

---

```markdown
---
name: preflight/agent-check
title: Check a Celo agent before you pay it (x402)
description: One call returns a fixed-rules verdict on a Celo agent wallet, OK to pay, Small amounts only or Don't pay, with the evidence: its ERC-8004 identity, whether its Altana spending key is live, revoked or expired, and who paid it in the last 30 days, with payers funded by the agent or its owner flagged. 0.02 USDC or USDT. Use before paying or hiring another agent.
category: data
stage: experimental
aliases: [agent, trust, check, verify, erc-8004, altana, kya, know-your-agent, reputation, preflight]
service_url: https://<production host>/api/v1/check
payment:
  schemes: [exact]
  networks: [celo]
  assets: [USDC, USDT]
---

# Check a Celo agent before you pay it

> Experimental listing: an early-stage third-party seller. buy has not reviewed it; confirm with the user before paying.

Sold directly by Preflight (Oh-Jay, github.com/ohjay-official), not through the buy gateway: the
payment goes to Preflight's agent wallet. Terms and support: https://github.com/ohjay-official/preflight/issues.

| route | what comes back | price | input |
|---|---|---|---|
| `GET /api/v1/check` | A JSON report: verdict, reason, and each check with its evidence and transaction links | 0.02 USDC or 0.02 USDT | `address`: the agent wallet to check (0x…) |

Data from: Celo mainnet, read directly (ERC-8004 Identity Registry, Altana KeyStore and the
wallet's own account) and through Blockscout's public API for payment history. No third-party
data is resold.

## Buying it

```sh
buy quote 'https://<production host>/api/v1/check?address=0x1111111111111111111111111111111111111111'
buy curl --max-amount 0.02 'https://<production host>/api/v1/check?address=0x1111111111111111111111111111111111111111'
```

If the address you check is your own agent (the payer is that wallet, or the owner or agent
wallet on its ERC-8004 record), Preflight also writes the result to that agent's ERC-8004
record, from its own Altana wallet. That happens only for self-checks.

## What comes back

`report.verdict` is one of `OK to pay`, `Small amounts only`, `Don't pay`, from fixed rules
listed on the site. `report.checks` holds `identity`, `keystore` and `payments`, each with a
status word (`Live`, `Revoked`, `Expired`, `Not found`, `Unread`) and a plain summary.
`payment.transaction` is the settlement. `receipt` is set only for self-checks.

The verdict is an onchain evidence check, not financial advice. It can't see funding that went
through an exchange, so it says "no funding link found", never "independent".

## Failures

- `400`: the address isn't a Celo address. Not charged.
- `502`: part of the chain couldn't be read. Not charged; try again.
- `503`: Preflight's own agent is stopped (its key was revoked or expired). Not charged.
- A response with a `PAYMENT-RESPONSE` header was paid for, whatever its status. Never retry a
  timeout automatically: run `buy receipts --resolve` first.
```
