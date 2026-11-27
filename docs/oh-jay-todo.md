# Oh-Jay's To-Do

Only the steps that need you: a passkey, a signature, money, or a mainnet transaction. Do each one only when Claude or Grok Bot says it's ready. Every step works from your phone.

Last updated: 27 Nov 2026, 20:00 WAT, by Claude.

**Order:** merge PR #2 (this file and the tests) and the Altana PR (`claude/altana-agent`, which has the setup page) first. Grok Bot or you can merge them; Claude can't from its session.

## Before Anything: The Site Address Must Be Final

Your admin passkey gets tied to the website address it's created on. If the address changes later, the passkey won't open the wallet there, and revoking on camera would fail. So:

The production address today is **`preflight-mu-six.vercel.app`** (the repo's homepage link). If you want a nicer name, rename it **now**, before step 1.

- [ ] **Grok Bot or you, in Vercel** (Project, Settings, Environment Variables, Production):
  - `NEXT_PUBLIC_PASSKEY_RP_ID` = `preflight-mu-six.vercel.app` (no `https://`)
  - `NEXT_PUBLIC_SITE_URL` = `https://preflight-mu-six.vercel.app`
  - `ATTRIBUTION_CODE` = the same code as the GitHub secret, so the agent's receipts carry it. It's public onchain anyway.
  - Then redeploy.
- [ ] **You:** create the passkey only on that exact address. Never on a preview link (the long ones with random letters). The setup page refuses to run anywhere else.

## 1. Create the Wallet with Your Phone's Passkey

**Status:** waiting for the setup page (Claude builds it on top of the scaffold).

1. Open `https://preflight-mu-six.vercel.app/setup` in Safari or Chrome on your phone.
2. Tap **Create wallet with a passkey**, then approve with Face ID or your fingerprint. Your phone saves a passkey named "Preflight".
3. Tap **Download backup file** and keep it in your Files app. It holds public details only and can't move money. It's the only way back to the wallet until its first transaction.
4. Send Claude the wallet address the page shows. It's public, so chat is fine. That address is the agent wallet for the whole event; enter it on Loops House when asked.

## 2. Fund the Wallet

**Status:** after step 1.

The setup page reads the cost live from Altana and shows the exact amount. Send what it shows, not the estimate below.

- **CELO for setup fees:** about **20 CELO** today. The first grant registers two keys in Altana's KeyStore, your passkey and the agent's key. Each costs a fixed $0.50 in CELO, which read as 8.23 CELO on 27 Nov. The wallet sends 10% extra and gets the extra back. Source: `docs/test-results.md`, test 1.
- **USDC for the agent's fees:** about **$3 on the Celo network**. It covers Altana's relay fee on each receipt the agent writes, about $0.005 a transaction.
- Later, on 5 Dec: about **9 more CELO** to give the agent a new key after the on-camera revoke, because a revoked key can't come back.

How:
1. On your exchange, withdraw CELO and USDC, choosing the **Celo** network.
2. Paste the wallet address from step 1.
3. Never send from your personal wallet; that would link it to this one onchain.
4. On the setup page, tap **Refresh** until it says the balance is enough.

## 3. Give the Agent Its Key (the Session Grant)

**Status:** after step 2.

1. On the setup page, check the limits it shows: a small daily USDC cap for fees, one allowed call (writing a receipt to the ERC-8004 registry), and an expiry of 14 Dec, after the 11 Dec winners announcement.
2. Tap **Grant session** and approve with your passkey. This is a mainnet transaction.
3. The page shows two values **once**: `ALTANA_SESSION_KEY` (secret) and `ALTANA_SESSION` (public).
4. Open vercel.com, go to the Preflight project, then **Settings**, then **Environment Variables**. Add both values for **Production**, then **Save**. Never paste them into any chat, including Grok Bot.
5. Also add `PAYTO_ADDRESS` = the wallet address from step 1. Payments for checks land in the agent's own wallet.
6. Redeploy (Deployments, the latest one, Redeploy). Tell Claude "session added". Claude checks the KeyStore shows the key as live.

## 3b. Get the x402 Facilitator Key

**Status:** any time before paid checks open.

Celo's x402 facilitator settles the $0.02 payments, and it needs an API key.

1. Open `https://x402.celo.org` on your phone, in your wallet app's browser.
2. Connect with a **fresh account** in that wallet, not your personal one. The Altana passkey wallet can't connect there. Sign the message it shows: it's a signature, no gas, no money.
3. Copy the API key and add it in Vercel as `X402_API_KEY` (Production). Never paste it into a chat.
4. Unverified until you see the dashboard: the free key covers about 20 mainnet settlements. After that, Celo's docs (13 Oct snapshot) list about $0.004 per settlement plus 0.3%, paid from a USDC balance you top up there. Send Claude a screenshot of the dashboard's pricing line.

## 4. Register the Agent's ERC-8004 Identity

**Status:** after step 3.

A passkey wallet doesn't register itself, so it needs one more tap.

1. On the setup page, tap **Register agent identity** and approve with your passkey. Gas only, no fee.
2. Send Claude the agent ID the page shows.

## 5. Loops House

**Status:** after step 4.

1. On Loops House, add the agent wallet address from step 1 to the entry. Use the Celo button in the playground, or the submit form.
2. If the form asks for an x402 PayTo address, use the same wallet address.
3. Send Claude a screenshot of the form before you submit anything.

## 6. Revoke on Camera (Sat 5 Dec, Filming)

**Status:** filming day.

1. Open the setup page, tap **Revoke**, and approve with your passkey, all on camera.
2. Claude shows Preflight reading the key as revoked and the agent refusing the next paid check.
3. After filming, grant a new session (step 3 again) and update the two Vercel values, so Preflight keeps working until judging.
