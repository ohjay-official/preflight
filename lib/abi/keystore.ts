/**
 * View ABI for the Altana Keystore.
 * Copied from the Blockscout verified contract KeyStore at
 * 0x83b30935f36d6ccf9B1ec3b5E47F2866b97cd27c (fetched 27 Nov 2026).
 * Celoscan's getabi endpoint refused the request without an API key.
 * Only read functions are included. This app does not send transactions.
 */
export const keystoreAbi = [
  {
    inputs: [],
    name: "VERSION",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "bytes32", name: "keyId", type: "bytes32" },
    ],
    name: "getExpiry",
    outputs: [{ internalType: "uint40", name: "", type: "uint40" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getKeys",
    outputs: [{ internalType: "bytes32[]", name: "", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "bytes32", name: "keyId", type: "bytes32" },
    ],
    name: "getMetadata",
    outputs: [{ internalType: "bytes", name: "", type: "bytes" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "bytes32", name: "keyId", type: "bytes32" },
    ],
    name: "isRootKey",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "bytes32", name: "keyId", type: "bytes32" },
    ],
    name: "isValidKey",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
