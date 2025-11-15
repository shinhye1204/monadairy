"use client";

import clsx from "clsx";
import { PixelCard } from "@/components/ui/pixel-card";
import { NFTAsset } from "@/types/nft";
import { NFTCard } from "./nft-card";

type Props = {
  assets: NFTAsset[];
  selectedIds?: string[];
  onToggle?: (asset: NFTAsset) => void;
  isLoading?: boolean;
  showPlaceholder?: boolean;
};

export function NFTGrid({
  assets,
  selectedIds = [],
  onToggle,
  isLoading,
  showPlaceholder = true
}: Props) {
  return (
    <PixelCard title="나의 Monad NFT" accent="pink" className="nft-grid-card">
      <div className="nft-grid">
        {isLoading &&
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="nft-card nft-card--skeleton">
              <div className="nft-card__art" />
              <div className="nft-card__meta" />
            </div>
          ))}
        {!isLoading &&
          assets.map((asset) => (
            <NFTCard
              key={`${asset.contractAddress}-${asset.tokenId}`}
              asset={asset}
              selected={selectedIds.includes(
                `${asset.contractAddress}-${asset.tokenId}`
              )}
              onSelect={() => onToggle?.(asset)}
            />
          ))}
      </div>
      {!isLoading && showPlaceholder && assets.length === 0 && (
        <p className="card-caption">
          아직 불러온 NFT가 없어요. 데모 데이터를 보려면 지갑 연결 없이도 캔버스를
          탐색할 수 있어요.
        </p>
      )}
    </PixelCard>
  );
}
