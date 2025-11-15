"use client";

import { FormEvent, useMemo, useState } from "react";
import { PixelCard } from "@/components/ui/pixel-card";
import { PixelButton } from "@/components/ui/pixel-button";

type Props = {
  contracts: string[];
  onAdd: (contract: string) => void;
  onRemove: (contract: string) => void;
};

const CONTRACT_WITH_TOKEN_REGEX =
  /^0x[a-fA-F0-9]{40}(?:\/\d+)?$/;

const formatEntry = (entry: string) => {
  const [address, tokenId] = entry.split("/");
  return {
    raw: entry,
    address,
    tokenId: tokenId ?? null
  };
};

export function ContractManager({ contracts, onAdd, onRemove }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const entries = useMemo(() => contracts.map(formatEntry), [contracts]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const normalized = value.trim();
    if (!CONTRACT_WITH_TOKEN_REGEX.test(normalized)) {
      setError("0x주소 또는 0x주소/토큰ID 형식으로 입력하세요.");
      return;
    }

    const normalizedLower = normalized.toLowerCase();

    if (contracts.some((contract) => contract.toLowerCase() === normalizedLower)) {
      setError("이미 추가된 주소입니다.");
      return;
    }

    onAdd(normalizedLower);
    setValue("");
  };

  return (
    <PixelCard title="커스텀 NFT 컨트랙트">
      <p className="card-caption">
        내 지갑에 있는 NFT 컨트랙트 주소 또는 주소/토큰ID를 추가하면 보유 중인 NFT를 스캔해 이미지를 불러옵니다.
      </p>
      <form className="contract-form" onSubmit={handleSubmit}>
        <input
          className="contract-input"
          placeholder="0x... 혹은 0x.../123"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <PixelButton type="submit" variant="pink">
          추가
        </PixelButton>
      </form>
      {error && <p className="contract-error">{error}</p>}
      <ul className="contract-list">
        {entries.map((contract) => (
          <li key={contract.raw}>
            <div className="contract-entry">
              <span className="contract-entry__address">
                {contract.address}
              </span>
              {contract.tokenId && (
                <span className="contract-entry__token">
                  Token #{contract.tokenId}
                </span>
              )}
            </div>
            <PixelButton
              type="button"
              variant="ghost"
              onClick={() => onRemove(contract.raw)}
            >
              삭제
            </PixelButton>
          </li>
        ))}
      </ul>
      {!contracts.length && (
        <p className="hint">
          예: 0xabc... — 컬렉션 전체 / 0xabc.../673 — 특정 토큰만 확인
        </p>
      )}
    </PixelCard>
  );
}
