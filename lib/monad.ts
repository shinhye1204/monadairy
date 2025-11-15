import { defineChain } from "viem";

const chainId =
  Number(process.env.NEXT_PUBLIC_MONAD_CHAIN_ID ?? "10143") || 10143;

const rpcUrl =
  process.env.NEXT_PUBLIC_MONAD_RPC ??
  "https://testnet-rpc.monad.xyz/"; /** fallback community RPC */

export const monadTestnet = defineChain({
  id: chainId,
  name: "Monad Testnet",
  network: "monad-testnet",
  nativeCurrency: {
    name: "MON",
    symbol: "MON",
    decimals: 18
  },
  rpcUrls: {
    default: { http: [rpcUrl] },
    public: { http: [rpcUrl] }
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet.monadexplorer.com"
    }
  }
});

const defaultCollections = [
  "0x87e1f1824c9356733a25d6bed6b9c87a3b31e107",
  "0xed52e0d80f4e7b295df5e622b55eff22d262f6ed",
  "0x4e0ca06351f6ae5cd6751d0c693eb3c1a1c39918",
  "0x1ae0dd47c0afbc5beb705e3772ca4dd5ffecd715"
] as const;

const envCollections =
  process.env.MONAD_NFT_COLLECTIONS?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

export const configuredCollections: string[] =
  envCollections.length > 0 ? envCollections : Array.from(defaultCollections);
