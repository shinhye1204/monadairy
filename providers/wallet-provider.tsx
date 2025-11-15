"use client";

import { PropsWithChildren, useMemo, useState } from "react";
import { WagmiConfig, createConfig } from "wagmi";
import { createPublicClient, http } from "viem";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { InjectedConnector } from "@wagmi/connectors/injected";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { monadTestnet } from "@/lib/monad";

export function WalletProvider({ children }: PropsWithChildren) {
  const queryClient = useState(() => new QueryClient())[0];
  const wagmiConfig = useMemo(() => {
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(monadTestnet.rpcUrls.default.http[0])
    });

    const connectors = [
      new MetaMaskConnector({
        chains: [monadTestnet],
        options: {
          shimDisconnect: true
        }
      }),
      createPhantomConnector()
    ].filter(Boolean) as any;

    return createConfig({
      autoConnect: true,
      connectors,
      publicClient
    });
  }, []);

  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiConfig>
  );
}

function createPhantomConnector() {
  if (typeof window === "undefined") return null;

  const connector = new InjectedConnector({
    chains: [monadTestnet],
    options: {
      name: "Phantom",
      shimDisconnect: true,
      getProvider: () => window.phantom?.ethereum
    }
  });

  (connector as unknown as { id: string }).id = "phantom";
  (connector as unknown as { name: string }).name = "Phantom";

  return connector;
}
