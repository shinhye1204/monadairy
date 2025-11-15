# Monadairy

핑크빛 우주 감성으로 Monad testnet NFT를 꾸미고 콜라주할 수 있는 Next.js 기반 웹앱입니다. 메타마스크 지갑을 연결하면 테스트넷 NFT를 불러와서 구름/스티커/픽셀 낙서/다른 NFT 조합으로 하나의 새로운 PFP를 만들 수 있습니다.

## 주요 기능

- **MetaMask / Phantom 연결**: wagmi + viem 기반으로 Monad testnet 체인에 연결합니다.
- **NFT 로딩**: `/api/nfts` 라우트가 지정한 NFT 컨트랙트를 스캔하고, 토큰 메타데이터(IPFS 포함)를 읽어서 화면에 보여줍니다. 지갑을 연결하지 않아도 데모 데이터로 경험할 수 있습니다.
- **커스텀 컨트랙트**: 지갑에 있는 NFT 컨트랙트 주소를 직접 추가할 수 있고, `0x주소/토큰ID` 형식으로 특정 토큰만 불러올 수도 있습니다.
- **픽셀 꾸미기**: 14×14 픽셀 그리드에 원하는 색을 찍어서 낙서를 더할 수 있습니다.
- **스티커 & 콤보**: 구름/별/하트/행성/네온 등 픽셀 스티커를 자유롭게 배치하고, 다른 NFT를 원형 궤도처럼 함께 배치해서 콜라주를 만들 수 있습니다.
- **Tamagochi & Cyworld mood**: 핑크/보라 우주 컬러, 픽셀 폰트, 구름 파티클 등으로 감성을 살렸습니다.

## 시작하기

```bash
npm install
npm run dev
```

> **참고:** 현재 환경에는 Node.js/npm이 없을 수 있습니다. `nvm` 또는 원하는 방식으로 Node 18 이상을 설치한 뒤 위 명령을 실행하세요.

## 환경 변수

`.env.local` 파일을 만들어서 아래 값을 설정할 수 있습니다.

```env
NEXT_PUBLIC_MONAD_RPC=https://testnet-rpc.monad.xyz/
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
MONAD_NFT_COLLECTIONS=0x...,0x...
```

- `MONAD_NFT_COLLECTIONS`에 쉼표로 구분한 ERC-721 컨트랙트 주소를 넣으면 해당 컬렉션의 토큰을 탐색합니다. 값을 비워두면 기본으로 제공한 4개의 샘플 NFT 컬렉션(Spiky, R3tard, Mongang, Dipsy)을 스캔합니다. 필요하다면 UI에서 `0x주소/토큰ID` 형식으로 추가해서 특정 토큰만 불러올 수 있습니다.
- 컨트랙트는 `tokenOfOwnerByIndex`가 구현된 ERC-721 Enumerable이어야 합니다.

## 폴더 구조

- `app/` – Next.js App Router 페이지 및 API 라우트
- `components/` – UI 컴포넌트 (지갑, NFT 카드, 픽셀 데코 스튜디오 등)
- `hooks/use-nfts.ts` – React Query 기반 NFT 데이터 훅
- `lib/monad.ts` – 체인/컨트랙트 설정
- `data/stickers.ts` – 픽셀 스티커 데이터

## 앞으로 확장 아이디어

1. 완성한 콜라주를 `<canvas>`로 렌더링해 이미지 다운로드 지원
2. Monad testnet 전용 NFT 인덱서 또는 GraphQL API와 연동해 자동으로 모든 컬렉션을 탐색
3. 꾸민 데이터를 온체인에 저장하거나, LayerZero 등을 이용해 다른 체인으로 브릿지

행복한 NFT 데코 타임 되세요 ✦
