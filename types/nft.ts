export type NFTAsset = {
  tokenId: string;
  contractAddress: `0x${string}`;
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type?: string; value?: string | number }>;
};
