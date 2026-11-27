# Test Results: Altana Side (Brief v2, Tests 1–4)

Run on Celo mainnet, 27 Nov 2026, 06:53–07:03 UTC, by `.github/workflows/altana-tests.yml`. The scripts are in `scripts/tests/`. Raw output is on the [`altana-test-results`](https://github.com/ohjay-official/preflight/tree/altana-test-results) branch.

Everything here is read-only: no keys, no signing, no money spent. Our own wallet doesn't exist yet, so the evidence comes from other entrants' public Altana wallets and transactions. Each test gets re-run on our own wallet once Oh-Jay sets it up (`docs/oh-jay-todo.md`).

## Summary

| Test | Result | What it means for Preflight |
|---|---|---|
| 1. Read an agent's keys; re-read after a revoke | **Pass** | Live, revoked and expired keys can all be told apart. Caps, allowlists and today's spend are readable too, from the wallet itself |
| 2. Tag survives Altana into Celo's `verifyTx` | **Pass for agent transactions**; grants and revokes carry no tag | The agent's own transactions count. Setup transactions don't, and don't need to |
| 3. Altana x402 paying a buy service on Celo | **Blocked at buy's facilitator** (not by the tokens) | Use the fallback: the session key tops up a small float inside its cap, and the float pays |
| 4. Payer data source: Chainstack via buy vs Blockscout | **Blockscout passes** (under 1.4 s, free). The RPC path fails the cost bar | Use Blockscout. Nothing is bought, so the agent's Altana action is the onchain receipt (the brief's fallback) |
| Extra: ERC-8004 registries for the receipt | Reputation and Validation registries are both live on Celo | The receipt can be built |

## Test 1: Agent Keys, Live and Revoked

**Method.** Scanned Altana's KeyStore (`0x83b3…d27c`) events over blocks 82,561,647–83,861,647 (about 15 days), then read every wallet found, both in the KeyStore and on the wallet's own account. Script: `t1-keys.mjs`.

**Found.** 96 KeyStore events: 72 `KeyRegistered` and 21 `KeyRevoked`. 34 wallets read; 31 have keys on their account, all EIP-7702 accounts delegated to Altana's implementation `0xc0f1…6fa3`. There are 19 live agent (session) keys: caps readable for all 19, allowlists readable for all 19.

**What a reader sees:**
- **KeyStore `getKey(user, keyId)`** returns `{ validator, publicKey, metadata, nonce, lastUpdated, revoked, expiry, isRoot }` in one call. A revoked key reads `revoked: true`, `isKeyActive: false`, `isValidKey: false`, and keeps its expiry. Example: [KeyRevoked tx 0x7a57…cb4c](https://celoscan.io/tx/0x7a579439a5050f6fbf37ac5bede5815dbd1572466fcfdcbdb3f6bdbe9aeccb4c).
- **KeyStore `getKeys(user)` lists only keys that aren't revoked.** A revoked key drops off the list, so finding it needs the `KeyRevoked(user, keyId)` event.
- **`getMetadata` is empty (`0x`) on every key read.** Caps aren't stored in the KeyStore.
- **The wallet account holds the caps.** `getKeys()` returns each key's expiry, type and admin flag. `spendInfos(keyHash)` returns token, period, limit and today's spend. `canExecutePackedInfos(keyHash)` returns the allowlist as target plus selector, where `0x32323232` means any function. Period values seen: 2 = day, 3 = week.
- **Not every session is in the KeyStore.** Hexbox's wallet `0xC177…8f82` shows only its root key in the KeyStore. Its live session (expires 9 Dec, $0.05/day on USDC and USD₮, may call `USDC.transfer`) appears only on the account, because it was granted with `register: false`. Preflight has to read both.
- **Registration fee now:** `KeyStoreController.getRegistrationFeeInWei()` = 8.2347 CELO (a fixed $0.50, priced by Chainlink).

**Still to do on our wallet:** grant, read, revoke, read again (Oh-Jay's todo, steps 3 and 6).

## Test 2: Does the Tag Survive Altana?

**Method.** Ran `@celo/attribution-tags` 0.6.0 `verifyTx` on real transactions. Script: `t2-tag.mjs`.

| Transaction | Codes `verifyTx` reads |
|---|---|
| Hexbox session-key execute via Altana's relay, [0xb460…0227](https://celoscan.io/tx/0xb460d2bd872edc4d19c1f85e63adc174564439cabe66ac01141b0b8d3f1c0227) | `altana`, `celo_73a54a0daad9`; sender = the Altana wallet |
| Hexbox grant via relay, [0xaf68…93cd](https://celoscan.io/tx/0xaf680c1b453efad02812cd9ed8abdc143b7879ba68813bbf46d80217b43593cd) | none |
| Three `KeyRevoked` transactions via relay (from test 1) | none |
| Hexbox and Errand ERC-8004 registrations from an EOA (control) | their codes |

**Meaning.**
- Agent transactions (`execute` with the SDK's `appCode`) are credited to the **wallet**, not the relayer. Celo's library decodes Altana's relayed intents (`fromOrchestratorCalldata`).
- Grant and revoke transactions carry no tag. That's the SDK's behaviour, also reported by Errand. They won't count, and the brief doesn't need them to.
- **For the check engine:** an Altana wallet's transactions are sent by relayer EOAs to Altana's entry contract `0xaf14…9751`, so `tx.from` is never the wallet. Find them with `verifyTx` or `fromOrchestratorCalldata`, whose `sender` field is the wallet.

## Test 3: Can Altana Pay a buy Service Over x402 on Celo?

**Method.** Asked buy's gateway for its 402 quote without paying, and checked the tokens' code. Script: `t3-x402.mjs`.

**Found.**
- buy quotes Chainstack's Celo RPC at **$0.01 a request** ("batch of up to 2000 calls"), x402 v2, scheme `exact` only (EIP-3009), payable in USDC, USD₮ or USA₮. It offers no Permit2 option.
- Celo's USDC (implementation `0xda06…becd`, version "2") and USD₮ (implementation `0xbf83…7b98`) both contain the `bytes`-signature `transferWithAuthorization` selector. That's the form that accepts a smart-wallet (ERC-1271) signature. Checked by selector presence in the bytecode.
- **The blocker is the facilitator.** Hexbox recorded on mainnet that buy's facilitator answers `malformed_payload` to Altana's 98-byte ERC-1271 session signature and accepts only 65-byte EOA signatures (6 rejections; Hexbox `STATUS.md`, 26 Nov). We haven't repeated the paid attempt, because it needs our funded wallet.

**Fallback (if we ever buy anything).** The session key may call `USDC.transfer` under its onchain daily cap. It tops up a small float, and the float signs ordinary EIP-3009 payments. To keep to "only the session key on the server", the float is the session key's own address: an Altana secp256k1 session key is an ordinary key with an address (`keyType 2` on the account stores it as an address). The float holds at most one day's cap. Hexbox runs this pattern on mainnet with a separate float key ([top-up 0xb460…0227](https://celoscan.io/tx/0xb460d2bd872edc4d19c1f85e63adc174564439cabe66ac01141b0b8d3f1c0227)).

## Test 4: Where the Payer Data Comes From

**Method.** For three real PayTo and agent addresses: 30 days of USDC and USD₮ payments in, plus each payer's first funding, from (A) Blockscout's public API and (B) plain `eth_getLogs`, the same calls Chainstack's archive RPC on buy would serve. Script: `t4-payers.mjs`.

| Address | Blockscout | Payments (30 days) | Payers | First funding found |
|---|---|---|---|---|
| Traction-Check PayTo `0x3Fc0…CB0e` | 1,353 ms, 5 requests, $0 | 7 (0.70 USD₮) | 2 | Both: one funded in CELO, one in USD₮ |
| Errand agent `0xc64d…C005` | 852 ms, 3 requests, $0 | 2 (0.02 USD₮) | 1 | Yes |
| AgentGuard PayTo `0x00D9…1319` | 175 ms, 1 request, $0 | 0 | 0 | (matches its own "no independent user yet") |

**RPC path.** forno rejects `eth_getLogs` ranges above about 2,500 blocks (2,531 passed, 10,125 failed; Celo makes one block a second). So 30 days of payments for one address takes **1,025 calls**, and one payer's 90-day funding trace takes about 3,075 more. Even batched at 2,000 calls per $0.01 request on Chainstack, five payers come to about 9 paid requests ($0.09), over the $0.05 bar. And Chainstack's own range limit is unverified.

**Decision (per the brief):** Blockscout is the source. It's fast, free, and also sees funding sent in plain CELO, which `eth_getLogs` can't. Nothing is bought to make the check work, so no purchase is invented. If Blockscout errors at check time, the report says "payer data unavailable" rather than guessing. We add a paid fallback only if we actually see Blockscout fail under real use, and we'd say so.

## Extra: The Onchain Receipt (the Agent's Altana Action)

With no data to buy, the brief's fallback makes the onchain receipt the agent's Altana action. Script: `t5-receipt.mjs`.

- **ERC-8004 Reputation Registry on Celo:** `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` (proxy to `ReputationRegistryUpgradeable`), with `giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)`.
- **ERC-8004 Validation Registry on Celo:** `0x8004Cc8439f36fd5F9F049D9fF86523Df6dAAB58` (proxy to `ValidationRegistryUpgradeable`), with `validationRequest(validator, agentId, requestURI, requestHash)` and `validationResponse(requestHash, response, responseURI, responseHash, tag)`.
- **Plan.** When an agent pays Preflight to check **itself** (opt-in only, never on agents that didn't ask), Preflight's Altana session writes the result to that agent's ERC-8004 record. The session's allowlist is that one function on that one contract (`to` + `signature`), with a small daily USDC cap for relay fees and an expiry of 14 Dec. Validation is the better fit in meaning, but a request must come first. Unverified: whether only the agent's owner may call `validationRequest`. Default to `giveFeedback` with `tag1 = "preflight"`, and switch if validation turns out open to the payer.

## Notes for the Check Engine (Grok Bot)

1. **Authority:** read both the KeyStore and the wallet account. To match an account key to a KeyStore key, compare the address derived from the KeyStore's 65-byte public key with the account's 20-byte key. Revoked keys come only from `KeyRevoked` events, and Blockscout's logs API filtered by `topic1 = user` is the cheap way to get them.
2. **Tags:** use `verifyTx` and take `sender`, not `tx.from`, for Altana wallets.
3. **Payers:** Blockscout `?module=account&action=tokentx` (newest first) for payments, and `tokentx`/`txlist` with `sort=asc&offset=5` for first funding. An Altana agent that pays over x402 does it from a float funded by its Altana wallet, so its funding trace leads back to that wallet. Label that "funded by an Altana agent wallet", not "no link".
