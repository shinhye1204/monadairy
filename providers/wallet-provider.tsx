"use client";

import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { WagmiConfig, createConfig } from "wagmi";
import { http } from "viem";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { InjectedConnector } from "@wagmi/connectors/injected";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { monadTestnet } from "@/lib/monad";

export function WalletProvider({ children }: PropsWithChildren) {
  const queryClient = useState(() => new QueryClient())[0];
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const wagmiConfig = useMemo(() => {
    const base = {
      chains: [monadTestnet],
      transports: {
        [monadTestnet.id]: http(monadTestnet.rpcUrls.default.http[0])
      }
    };

    if (!isClient) {
      return createConfig({ ...base, connectors: [] });
    }

    const connectors = [
      new MetaMaskConnector({
        chains: [monadTestnet],
        options: {
          shimDisconnect: true
        }
      }),
      createPhantomConnector()
    ].filter(Boolean);

    return createConfig({
      ...base,
      connectors: connectors as any
    });
  }, [isClient]);

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
