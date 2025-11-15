"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { PixelCard } from "@/components/ui/pixel-card";
import { PixelButton } from "@/components/ui/pixel-button";
import { monadTestnet } from "@/lib/monad";

function truncateAddress(address?: string | null) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ConnectPanel() {
  const { address, status } = useAccount();
  const { connect, connectors, isPending, variables } = useConnect();
  const { disconnect } = useDisconnect();

  const isConnected = status === "connected" && !!address;

  const supportedConnectors = connectors.filter((connector) =>
    ["metaMask", "phantom"].includes(connector.id)
  );

  const pendingId = variables?.connector?.id;

  return (
    <PixelCard title="지갑 연결" className="connect-card">
      <p className="card-caption">
        MetaMask 또는 Phantom 지갑을 연결하면 Monad testnet NFT를 바로 불러올 수
        있어요.
      </p>
      <div className="wallet-status">
        <div>
          <p className="wallet-status__label">연결 상태</p>
          <p className="wallet-status__value">
            {isConnected ? truncateAddress(address) : "지갑 미연결"}
          </p>
        </div>
        <div>
          <p className="wallet-status__label">체인</p>
          <p className="wallet-status__value">{monadTestnet.name}</p>
        </div>
      </div>

      {isConnected ? (
        <PixelButton variant="ghost" block onClick={() => disconnect()}>
          연결 해제하기
        </PixelButton>
      ) : (
        <div className="wallet-connectors">
          {supportedConnectors.map((connector) => (
            <PixelButton
              key={connector.id}
              variant={connector.id === "metaMask" ? "pink" : "purple"}
              block
              disabled={!connector.ready}
              loading={isPending && pendingId === connector.id}
              onClick={() =>
                connect({
                  connector,
                  chainId: monadTestnet.id
                })
              }
            >
              {connector.name} 연결
            </PixelButton>
          ))}
          {!supportedConnectors.some((connector) => connector.ready) && (
            <p className="hint">
              MetaMask 또는 Phantom 확장을 설치한 뒤 페이지를 새로 고침해주세요.
            </p>
          )}
        </div>
      )}
    </PixelCard>
  );
}
