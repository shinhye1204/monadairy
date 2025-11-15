"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectPanel } from "@/components/wallet/connect-panel";
import { NFTGrid } from "@/components/nfts/nft-grid";
import { DecorationStudio } from "@/components/decorations/decoration-studio";
import { useNfts } from "@/hooks/use-nfts";
import { NFTAsset } from "@/types/nft";
import { ContractManager } from "@/components/wallet/contract-manager";

export default function HomePage() {
  const { address } = useAccount();
  const [customContracts, setCustomContracts] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("monadairy.contracts");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const pattern = /^0x[a-fA-F0-9]{40}(?:\/\d+)?$/;
          setCustomContracts(
            parsed
              .filter((value) => pattern.test(value))
              .map((value) => value.toLowerCase())
          );
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "monadairy.contracts",
      JSON.stringify(customContracts)
    );
  }, [customContracts]);

  const viewingAddress = address ?? null;
  const { assets, isLoading, error } = useNfts(viewingAddress, {
    contracts: customContracts
  });

  useEffect(() => {
    setSelectedIds((previous) => {
      const allowed = new Set(
        assets.map(
          (asset) => `${asset.contractAddress}-${asset.tokenId}`
        )
      );
      const filtered = previous.filter((id) => allowed.has(id));
      if (filtered.length > 0) return filtered;
      if (!assets.length) return [];
      const first = assets[0];
      return [`${first.contractAddress}-${first.tokenId}`];
    });
  }, [assets]);

  const selectedAssets: NFTAsset[] = useMemo(
    () =>
      assets.filter((asset) =>
        selectedIds.includes(`${asset.contractAddress}-${asset.tokenId}`)
      ),
    [assets, selectedIds]
  );

  return (
    <main className="page">
      <header className="hero">
        <p className="hero__eyebrow">MONADAIRY.EXE</p>
        <h1>
          핑크빛 우주에서
          <br />
          NFT를 꾸며봐요 ✦
        </h1>
        <p className="hero__description">
          메타마스크 지갑을 연결하고 Monad testnet NFT를 불러온 뒤, 구름과 스티커,
          픽셀 낙서, 그리고 다른 NFT를 섞어 새로운 PFP를 만들어보세요.
        </p>
      </header>

      <section className="grid">
        <div className="sidebar">
          <ConnectPanel />
          <ContractManager
            contracts={customContracts}
            onAdd={(contract) =>
              setCustomContracts((prev) => [...prev, contract])
            }
            onRemove={(contract) =>
              setCustomContracts((prev) =>
                prev.filter(
                  (value) => value.toLowerCase() !== contract.toLowerCase()
                )
              )
            }
          />
          {error && <p className="error-message">{error.message}</p>}
          {viewingAddress && (
            <div className="viewing-banner">
              현재 보는 다이어리:{" "}
              {`내 지갑 (${viewingAddress.slice(0, 6)}...${viewingAddress.slice(-4)})`}
            </div>
          )}
          <NFTGrid
            assets={assets}
            selectedIds={selectedIds}
            isLoading={isLoading}
            onToggle={(asset) => {
              const id = `${asset.contractAddress}-${asset.tokenId}`;
              setSelectedIds((prev) =>
                prev.includes(id)
                  ? prev.filter((value) => value !== id)
                  : [...prev, id]
              );
            }}
          />
        </div>
        <div className="content">
          <DecorationStudio selected={selectedAssets} available={assets} />
        </div>
      </section>
    </main>
  );
}
