# Preflight

Check any Celo agent before you pay it or plug it in.

Preflight is a read-only check for one Celo agent wallet. You give an address. It reads Celo mainnet (chain 42220) and returns one verdict: **OK to pay**, **Small amounts only**, or **Don't pay**. Each check has a plain status: Live, Revoked, Expired, or Not found. There is no model judgment and no score out of 100.

This is an entry for Celo Agents Open for Business (Loops House), Altana Smart Agentic Wallets track. The track closes Monday 7 December 2026, 10:00 WAT.

## What it checks

1. **Who is it.** ERC-8004 identity on the Celo mainnet registry `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`, the address published in the [Celo ERC-8004 docs](https://docs.celo.org/build-on-celo/build-with-ai/8004). The check reads `balanceOf`, and `ownerOf`, `getAgentWallet`, and `tokenURI` for token ids that show up in this address's NFT transfer history. The registry has no view from a wallet back to an agent id, so a wallet set with `setAgentWallet` and absent from that history is reported as not found.

2. **Can it be stopped.** Altana Keystore at `0x83b30935f36d6ccf9B1ec3b5E47F2866b97cd27c`. The contract is verified on Blockscout as `KeyStore`. For each id from `getKeys`, the check calls `isValidKey`, `isRootKey`, `getExpiry`, and `getMetadata`. It reports live, revoked, or expired, and root key versus agent key. It does not show spending caps. Metadata is raw bytes.

3. **Has anyone real paid it.** Incoming native CELO and ERC-20 transfers over the last 30 days, the number of distinct payers, and a one-hop funding link: did a payer also receive funds from the agent or the identity owner in that window? The wording is "No funding link found." That only means this check did not see a transfer from the agent or the owner to that payer. History comes from Blockscout's Celo API behind `ActivitySource`. A Chainstack archive source is named in code and is not wired.

4. **Attribution tags, off unless `HACKATHON_MODE=true`.** Share of transactions sent by the address in the same 30 day window whose calldata ends in a Celo attribution tag. Tags are decoded only. This check does not change the verdict. Relayed transactions that are not indexed to or from the address are outside the count.

## Verdict rules

Don't pay if the identity is missing or could not be read, or if the keystore has no live key.

Small amounts only if identity and a live key both pass, but fewer than two distinct payers paid in 30 days, a funding link was found, or payment history is missing or incomplete.

OK to pay only when the identity is registered, a key is live, at least two distinct payers paid in the last 30 days, and no funding link was found.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000, paste an address, and run the check. The same report is at `/report/<address>` and as JSON at `/api/check?address=0x...`.

```bash
npm test
npm run test:live   # optional Keystore read, needs network
npm run build
```

## Environment

| Name | Purpose |
| --- | --- |
| `ATTRIBUTION_CODE` | Tag appended to any calldata this app would send. |
| `CELO_RPC_URL` | Read RPC. Default `https://forno.celo.org`. |
| `BLOCKSCOUT_API_URL` | Classic Blockscout API. Default `https://celo.blockscout.com/api`. |
| `ACTIVITY_SOURCE` | `blockscout` or `chainstack`. Chainstack throws a TODO. |
| `HACKATHON_MODE` | `true` adds the attribution-tag check. |
| `X402_GATING_ENABLED` | `true` turns on the unpaid 402 stub. |

## Attribution

This version sends no transactions and holds no keys. `lib/attribution.ts` appends `ATTRIBUTION_CODE` to calldata. Any later mainnet transaction from this app has to go through that helper, so the tag is on the calldata.

## Not done yet

- x402 gating at $0.02 per check. The stub is off. Turning the flag on returns HTTP 402 and still collects nothing.
- A paid indexer (Chainstack archive RPC via x402) behind the activity provider. Blockscout is the only source that runs.
- An Altana session-key agent. This app only reads the keystore.
- A reverse index for ERC-8004 `agentWallet`. The docs address is used. There is no on-chain getter from wallet to agent id.

## Addresses and ABI

The identity registry address is the one in the Celo docs linked above. The Keystore address is the one given for this track. Its view ABI was copied from the Blockscout verified source (`KeyStore`, compiler 0.8.26). Celoscan's ABI endpoint refused the request without an API key, so that copy was not re-checked there. The Keystore is not a proxy. The identity registry is an ERC-1967 proxy. Calls go to the proxy.
