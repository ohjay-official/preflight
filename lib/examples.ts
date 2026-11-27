import type { Address } from "viem";

/**
 * Real Celo mainnet addresses, read on 27 Nov 2026.
 * The report page checks them again. These labels only describe that read.
 */
export const EXAMPLE_ADDRESSES: Array<{ address: Address; label: string }> = [
  {
    address: "0x4d9E88F9bA578d546cdb620219f8F519fF11B1c0",
    label: "Owns ERC-8004 identity 10154. That identity's agent wallet is this same address.",
  },
  {
    address: "0xbfFcCa1F539455d3FF8A181f6598767d074fFA7F",
    label: "Agent wallet for ERC-8004 identity 166. This address does not own the identity NFT.",
  },
  {
    address: "0xa8dcf6a0304D27cb306830b9503F8cFcf38EFf7D",
    label: "Altana Keystore has two live keys here: a root key with no expiry, and one agent key.",
  },
];
