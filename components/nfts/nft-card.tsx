"use client";

import Image from "next/image";
import clsx from "clsx";
import { NFTAsset } from "@/types/nft";

type Props = {
  asset: NFTAsset;
  selected?: boolean;
  onSelect?: () => void;
};

export function NFTCard({ asset, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      className={clsx("nft-card", selected && "nft-card--selected")}
      onClick={onSelect}
    >
      <div className="nft-card__art">
        {asset.image ? (
          <Image
            src={asset.image}
            alt={asset.name ?? `Token #${asset.tokenId}`}
            fill
            sizes="120px"
          />
        ) : (
          <div className="nft-card__placeholder">no image</div>
        )}
        <span className="nft-card__frame" />
      </div>
      <div className="nft-card__meta">
        <p className="nft-card__name">{asset.name ?? "이름 없는 NFT"}</p>
        <p className="nft-card__id">#{asset.tokenId}</p>
      </div>
    </button>
  );
}
