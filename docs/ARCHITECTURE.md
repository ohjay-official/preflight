# Preflight architecture

Preflight reads Celo mainnet and returns one verdict. The check engine does not sign, store a key, or send a transaction. Preflight's own agent (the Altana side, below) sends one kind of transaction, a receipt, from an Altana wallet its owner controls with a passkey.

## Request path

`GET /api/check?address=0x...` and `/report/[address]` both call `loadCachedReport`. That function keeps a successful report in memory for 30 seconds. Inside one check, these reads run together:

- Identity `balanceOf`
- Keystore `getKeys`, then `isValidKey`, `isRootKey`, `getExpiry`, and `getMetadata`
- Blockscout account history (native transactions, ERC-20 transfers, internal transactions)
- NFT transfer ids for the identity registry
- The agent-wallet log index lookup

Token ids from NFT history and from the wallet index are then read with `ownerOf`, `getAgentWallet`, and `tokenURI`. Owner history, for a one-hop funding link, starts only after those reads, and only for owners that are not the address itself.

## Identity wallet index

The verified identity registry does not have a view from wallet to agent id. `setAgentWallet` emits `MetadataSet`, not a separate `AgentWalletSet` event. The indexed key is the string `agentWallet`.

`lib/identity/wallet-index.ts` loads those logs from Blockscout in block chunks, keeps the latest wallet per agent id, and caches the map for 60 seconds. A match is confirmed with `getAgentWallet` before it is shown. Forno's `eth_getLogs` limit is 5000 blocks, which is too small to scan the registry's history inside the check, so the full index uses the Blockscout logs API. If that index does not finish, the identity check is Unread rather than Not found.

## Activity source

```ts
interface ActivitySource {
  readonly label: string;
  getAccountActivity(address, sinceUnix): Promise<AccountActivity>;
  getIdentityTokenIds(address, registry): Promise<{ tokenIds: bigint[]; truncated: boolean }>;
}
```

`BlockscoutActivitySource` is the working source. It retries 429 and 5xx with a short backoff, times out each call, and pages history until the rows are older than 30 days or 15 pages are read. If the classic module API fails, the same lists are read from Blockscout API v2. A capped history is marked incomplete, and the verdict stays out of "OK to pay".

When both token lists fail, `readIncomingTokenLogs` calls `eth_getLogs` for `Transfer(address,address,uint256)` with the recipient in topic 2. Forno allows 5000 blocks per query. A full 30 day scan does not fit in the check, so the scan runs newest-first for about 4.5 seconds and, if it stops early, marks the history incomplete.

## Extension points

These three are interfaces only. Do not add a private key or a transaction while implementing them.

### x402 gate

`X402Gate` in `lib/extensions/x402-gate.ts`. `decide` returns null to run the check, or a 402 body to stop. The placeholder in `lib/x402.ts` does not collect a payment. Price is $0.02. Replace that placeholder. Do not invent a signer.

### Paid activity source

`PaidActivitySource` in `lib/extensions/paid-activity.ts` extends `ActivitySource` with `kind: "paid"`. `createPaidActivitySource` throws. `ACTIVITY_SOURCE=paid` and `ACTIVITY_SOURCE=chainstack` both call it. Implement the archive reads behind this function. Keep it read-only.

### Altana session-key agent

`SessionKeyAgent` in `lib/extensions/session-agent.ts`. `readStatus` describes this app's own session key. `SESSION_KEY_AGENT.implemented` is false. The check engine already reads the Keystore for any address a caller submits. This interface is only for Preflight's own agent, which is not deployed.

## Caches

| Cache | TTL | What it stores |
| --- | --- | --- |
| Report | 30 seconds | The finished check for an address |
| Agent wallet index | 60 seconds | Latest `setAgentWallet` value per agent id |

Both caches share one in-flight load per key, including two callers in the same request.

## Altana side

Brief v2's Altana track work. Evidence for every choice here is in `docs/test-results.md` (tests 1–4, run on mainnet on 27 Nov).

### Who holds what

| Key | Where | Can do |
| --- | --- | --- |
| Admin passkey | The owner's phone (WebAuthn, bound to `NEXT_PUBLIC_PASSKEY_RP_ID`) | Create the wallet, grant and revoke the agent's key, register ERC-8004 |
| Agent session key | Vercel env `ALTANA_SESSION_KEY`, pasted by the owner after the grant | Call `giveFeedback` on the ERC-8004 Reputation Registry, nothing else, up to $0.25 USDC a day, until 14 Dec |

The session key is generated in the owner's browser on `/setup` and shown once. No admin key or seed exists on a server.

### Routes

- `/setup`: the owner's page. It creates the passkey wallet, shows the funding needed (read live from `KeyStoreController.getRegistrationFeeInWei`), grants and revokes the session, and registers the wallet's ERC-8004 identity. It refuses to run on any host but the passkey host.
- `GET /api/agent`: public state of the agent's key (live, revoked or expired), the caps and allowlist the wallet enforces, and whether paid checks are ready.
- `GET /api/v1/check?address=`: the paid check, $0.02 in USDC or USD₮ over x402 on Celo's facilitator (`lib/x402-seller.ts`). It refuses with 503 before asking for payment when the agent's key isn't live, verifies the payment, runs `loadCachedReport`, and settles only if no check came back Unread. The free `/api/check` route and the report pages are unchanged.

### The receipt

When the payer is the checked agent (the address itself, or the owner or agent wallet on its ERC-8004 record), the agent writes `giveFeedback(agentId, value, 0, "preflight", verdict, "", reportUrl, reportHash)` from the Altana wallet (`lib/altana/agent.ts`). The value is 100, 50 or 0 for OK to pay, Small amounts only and Don't pay. The call carries the ERC-8021 tag `altana,<ATTRIBUTION_CODE>` through the SDK's `appCode`, and Celo's `verifyTx` credits it to the wallet (test 2). After a revoke, the account rejects the call at validation, and `/api/v1/check` stops before asking for payment.

### Reading Altana keys

`lib/altana/account.ts` reads the wallet account's own views: `getKeys()`, `spendInfos(keyHash)` for caps and the current period's spend, and `canExecutePackedInfos(keyHash)` for the allowlist. The KeyStore holds no caps (`getMetadata` is empty on every key read on 27 Nov). It lists only keys that aren't revoked; a revoked key shows up through `KeyRevoked(user, keyId)` and `getKey(user, keyId).revoked`. The check engine can reuse these helpers to show caps on any Altana wallet.

### Not built

The paid activity source stays unimplemented. Test 4 picked Blockscout: under 1.4 s and free, against 1,025+ RPC calls for 30 days of logs.
