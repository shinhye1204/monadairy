"use client";

import { useQuery } from "@tanstack/react-query";
import { NFTAsset } from "@/types/nft";

type ResponseShape = {
  assets: NFTAsset[];
  fallback?: boolean;
  error?: string;
};

type FetchOptions = {
  owner?: string | null;
  contracts?: string[];
};

async function fetchNfts({
  owner,
  contracts
}: FetchOptions): Promise<ResponseShape> {
  const query = new URLSearchParams();
  if (owner) query.set("owner", owner);
  if (contracts && contracts.length) {
    query.set("contracts", contracts.join(","));
  }

  const params = query.toString();
  const res = await fetch(`/api/nfts${params ? `?${params}` : ""}`);

  if (!res.ok) {
    const message = await res.json().catch(() => ({}));
    throw new Error(message?.error ?? "NFT 데이터를 불러오지 못했습니다.");
  }

  return res.json();
}

type UseNftsOptions = {
  contracts?: string[];
};

export function useNfts(owner?: string | null, options?: UseNftsOptions) {
  const hasAddress = !!owner && /^0x[a-fA-F0-9]{40}$/.test(owner);
  const normalizedContracts = Array.from(
    new Set(
      (options?.contracts ?? [])
        .map((contract) => contract.trim().toLowerCase())
        .filter(Boolean)
    )
  );

  const query = useQuery({
    queryKey: [
      "nfts",
      hasAddress ? owner.toLowerCase() : "demo",
      normalizedContracts.join("|")
    ],
    queryFn: () =>
      fetchNfts({
        owner: hasAddress ? owner : undefined,
        contracts: normalizedContracts
      }),
    enabled: hasAddress || !owner,
    staleTime: 30_000
  });

  return {
    assets: query.data?.assets ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    isFallback: query.data?.fallback ?? false,
    refetch: query.refetch
  };
}
