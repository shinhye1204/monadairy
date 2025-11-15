import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { monadTestnet, configuredCollections } from "@/lib/monad";
import { resolveIpfs } from "@/lib/ipfs";
import { NFTAsset } from "@/types/nft";
const CONTRACT_FALLBACKS: Record<
  string,
  { image: string; name?: string; description?: string }
> = {
  "0x87e1f1824c9356733a25d6bed6b9c87a3b31e107": {
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80",
    name: "Spiky Nebula Egg",
    description: "찌릿한 가시와 구름이 뒤섞인 몬다이어리 우주 알."
  },
  "0xed52e0d80f4e7b295df5e622b55eff22d262f6ed": {
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    name: "R3tard Holo Diary",
    description: "CRT 모니터에서 깜빡이는 사이월드 다이어리 한 페이지."
  },
  "0x4e0ca06351f6ae5cd6751d0c693eb3c1a1c39918": {
    image:
      "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=800&q=80",
    name: "Mongang Bubble Bot",
    description: "말풍선으로 대화하는 작은 로봇 펫."
  },
  "0x1ae0dd47c0afbc5beb705e3772ca4dd5ffecd715": {
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80",
    name: "Dipsy Cloud Cow",
    description: "우주 구름을 헤엄치는 민트 젖소."
  }
};

export const runtime = "nodejs";

const erc721EnumerableAbi = [
  {
    type: "function",
    stateMutability: "view",
    name: "balanceOf",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }]
  },
  {
    type: "function",
    stateMutability: "view",
    name: "ownerOf",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "address" }]
  },
  {
    type: "function",
    stateMutability: "view",
    name: "tokenOfOwnerByIndex",
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" }
    ],
    outputs: [{ type: "uint256" }]
  },
  {
    type: "function",
    stateMutability: "view",
    name: "tokenURI",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "string" }]
  }
] as const;

const demoAssets: NFTAsset[] = [
  {
    tokenId: "0001",
    contractAddress: "0x7e57cafe00000000000000000000000000000000",
    name: "Cosmic Poodle",
    description: "A dreamy guardian dog that floats between Monad cloud homes.",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80"
  },
  {
    tokenId: "0007",
    contractAddress: "0x7e57cafe00000000000000000000000000000000",
    name: "Pixel Nebula Boba",
    description: "Strawberry nebula with tapioca moons.",
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=640&q=80"
  },
  {
    tokenId: "0012",
    contractAddress: "0x9ff1ce0000000000000000000000000000000000",
    name: "Tamaghost",
    description: "A shy tamagotchi spirit that loves old-school Cyworld diaries.",
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=640&q=80"
  }
];

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(monadTestnet.rpcUrls.default.http[0])
});

const normalizeAddress = (value: string) =>
  value.toLowerCase() as `0x${string}`;

type ParsedContract = {
  address: `0x${string}`;
  tokens: bigint[];
};

function parseContracts(param: string | null): ParsedContract[] {
  if (!param) return [];

  const map = new Map<`0x${string}`, bigint[]>();
  param
    .split(",")
    .map((item) => item.trim())
    .forEach((entry) => {
      if (!entry) return;
      const [addressPart, tokenPart] = entry.split("/");
      if (!/^0x[a-fA-F0-9]{40}$/.test(addressPart)) return;
      const normalized = addressPart.toLowerCase() as `0x${string}`;
      const current = map.get(normalized) ?? [];
      if (tokenPart && tokenPart.length > 0) {
        try {
          const tokenId = BigInt(tokenPart);
          current.push(tokenId);
        } catch {
          // ignore invalid token id
        }
      }
      map.set(normalized, current);
    });

  return Array.from(map.entries()).map(([address, tokens]) => ({
    address,
    tokens
  }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner");
  const customContracts = parseContracts(searchParams.get("contracts"));

  if (!owner) {
    return NextResponse.json({ assets: demoAssets }, { status: 200 });
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(owner)) {
    return NextResponse.json(
      { error: "올바른 지갑 주소를 입력해주세요." },
      { status: 400 }
    );
  }

  const contractFilters = new Map<`0x${string}`, bigint[]>();
  customContracts.forEach((entry) => {
    contractFilters.set(entry.address, entry.tokens);
  });

  configuredCollections.forEach((address) => {
    const normalized = address.toLowerCase() as `0x${string}`;
    if (!contractFilters.has(normalized)) {
      contractFilters.set(normalized, []);
    }
  });

  if (!contractFilters.size) {
    return NextResponse.json({ assets: [] }, { status: 200 });
  }

  const lowerOwner = owner.toLowerCase() as `0x${string}`;
  const filterEntries = Array.from(contractFilters.entries());

  try {
    const ownedAssets: NFTAsset[] = [];

    for (const [contractAddress, tokenOverrides] of filterEntries) {
      const checksumAddress = contractAddress as `0x${string}`;
      const normalizedContract = contractAddress.toLowerCase();

      if (tokenOverrides.length > 0) {
        for (const tokenId of tokenOverrides) {
          let tokenOwner: `0x${string}` | null = null;
          try {
            tokenOwner = (await publicClient.readContract({
              abi: erc721EnumerableAbi,
              address: checksumAddress,
              functionName: "ownerOf",
              args: [tokenId]
            })) as `0x${string}`;
          } catch (ownerError) {
            console.warn(
              "[nfts] ownerOf failed",
              checksumAddress,
              tokenId.toString(),
              ownerError
            );
            continue;
          }

          if (tokenOwner.toLowerCase() !== lowerOwner) continue;

          let tokenUri: string | null = null;
          try {
            tokenUri = (await publicClient.readContract({
              abi: erc721EnumerableAbi,
              address: checksumAddress,
              functionName: "tokenURI",
              args: [tokenId]
            })) as string;
          } catch (error) {
            tokenUri = null;
          }

          let metadata: any = null;
          const resolved = resolveIpfs(tokenUri);
          if (resolved) {
            try {
              const res = await fetch(resolved);
              if (res.ok) {
                metadata = await res.json();
              }
            } catch {
              metadata = null;
            }
          }

          const fallback = CONTRACT_FALLBACKS[normalizedContract];

          ownedAssets.push({
            tokenId: tokenId.toString(),
            contractAddress: checksumAddress,
            name: metadata?.name ?? fallback?.name ?? `#${tokenId.toString()}`,
            description:
              metadata?.description ?? fallback?.description ?? undefined,
            image: resolveIpfs(metadata?.image) ?? fallback?.image ?? undefined,
            attributes: metadata?.attributes
          });
        }
        continue;
      }
      const balance = await publicClient.readContract({
        abi: erc721EnumerableAbi,
        address: checksumAddress,
        functionName: "balanceOf",
        args: [lowerOwner]
      });

      const safeBalance = Number(balance);
      if (Number.isNaN(safeBalance) || safeBalance === 0) continue;

      const capped = Math.min(safeBalance, 24);
      const tokenIds: bigint[] = [];
      let enumerationFailed = false;

      for (let i = 0; i < capped; i += 1) {
        try {
          const tokenId = await publicClient.readContract({
            abi: erc721EnumerableAbi,
            address: checksumAddress,
            functionName: "tokenOfOwnerByIndex",
            args: [lowerOwner, BigInt(i)]
          });
          tokenIds.push(tokenId);
        } catch (tokenError) {
          console.warn(
            "[nfts] tokenOfOwnerByIndex failed",
            checksumAddress,
            tokenError
          );
          enumerationFailed = true;
          break;
        }
      }

      if (enumerationFailed && !tokenIds.length) {
        continue;
      }

      for (const tokenId of tokenIds) {

        let tokenUri: string | null = null;
        try {
          tokenUri = (await publicClient.readContract({
            abi: erc721EnumerableAbi,
            address: checksumAddress,
            functionName: "tokenURI",
            args: [tokenId]
          })) as string;
        } catch (error) {
          tokenUri = null;
        }

        let metadata: any = null;
        const resolved = resolveIpfs(tokenUri);
        if (resolved) {
          try {
            const res = await fetch(resolved);
            if (res.ok) {
              metadata = await res.json();
            }
          } catch {
            metadata = null;
          }
        }

        const fallback = CONTRACT_FALLBACKS[normalizedContract];

        ownedAssets.push({
          tokenId: tokenId.toString(),
          contractAddress: checksumAddress,
          name: metadata?.name ?? fallback?.name ?? `#${tokenId.toString()}`,
          description: metadata?.description ?? fallback?.description ?? undefined,
          image: resolveIpfs(metadata?.image) ?? fallback?.image ?? undefined,
          attributes: metadata?.attributes
        });
      }
    }

    if (!ownedAssets.length) {
      return NextResponse.json({ assets: demoAssets }, { status: 200 });
    }

    return NextResponse.json(
      { assets: ownedAssets },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120"
        }
      }
    );
  } catch (error) {
    console.error("[nfts] failed", error);
    return NextResponse.json(
      { assets: demoAssets, fallback: true },
      { status: 200 }
    );
  }
}
