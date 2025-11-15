"use client";

import Image from "next/image";
import {
  ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import clsx from "clsx";
import { NFTAsset } from "@/types/nft";
import { PixelCard } from "@/components/ui/pixel-card";
import { PixelButton } from "@/components/ui/pixel-button";
import { StickerPalette } from "./sticker-palette";
import { ColorPalette } from "./color-palette";
import { PixelCanvas } from "./pixel-canvas";
import { STICKER_LIBRARY } from "@/data/stickers";
import { PixelSprite } from "./pixel-sprite";

type Placement = {
  id: string;
  stickerId: string;
  x: number;
  y: number;
  scale: number;
  locked?: boolean;
};

const GRID = 14;
const STAGE_PADDING = 0.12;
const STAGE_RANGE = 1 - STAGE_PADDING * 2;
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const COLORS = [
  "#ff82c4",
  "#ffa8f7",
  "#ffd6ff",
  "#ffb347",
  "#7af5ff",
  "#a4b1fe",
  "#cdb4ff",
  "#fff1c1"
];

const stickerMap = Object.fromEntries(
  STICKER_LIBRARY.map((sticker) => [sticker.id, sticker])
);

const randomId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

type Props = {
  selected: NFTAsset[];
  available: NFTAsset[];
};

const assetKey = (asset: NFTAsset) =>
  `${asset.contractAddress}-${asset.tokenId}`;

export const DecorationStudio = memo(function DecorationStudio({
  selected,
  available
}: Props) {
  const primaryBase = selected[0] ?? null;
  const secondaryBases = selected.slice(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pixels, setPixels] = useState<(string | null)[]>(
    () => Array(GRID * GRID).fill(null)
  );
  const isPaintingRef = useRef(false);
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[0]);
  const [brushMode, setBrushMode] = useState<"pixel" | "brush">("pixel");
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [activeFriends, setActiveFriends] = useState<string[]>([]);
  const [customImages, setCustomImages] = useState<NFTAsset[]>([]);
  const [baseScale, setBaseScale] = useState(1);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const cleanupCustomImages = useCallback((images: NFTAsset[]) => {
    images.forEach((asset) => {
      if (asset.contractAddress === "0xcustom-image" && asset.image?.startsWith("blob:")) {
        URL.revokeObjectURL(asset.image);
      }
    });
  }, []);

  useEffect(() => {
    setPixels(Array(GRID * GRID).fill(null));
    setPlacements([]);
    setActiveFriends([]);
    setCustomImages((prev) => {
      cleanupCustomImages(prev);
      return [];
    });
    setBaseScale(1);
  }, [primaryBase?.contractAddress, primaryBase?.tokenId, cleanupCustomImages]);

  useEffect(() => {
    return () => {
      cleanupCustomImages(customImages);
    };
  }, [customImages, cleanupCustomImages]);

  useEffect(() => {
    const handleUp = () => {
      isPaintingRef.current = false;
    };
    window.addEventListener("mouseup", handleUp);
    return () => window.removeEventListener("mouseup", handleUp);
  }, []);

  const handlePaint = useCallback(
    (index: number) => {
      setPixels((previous) => {
        const next = [...previous];
        const paint = (idx: number) => {
          if (idx < 0 || idx >= GRID * GRID) return;
          next[idx] = selectedColor;
        };
        paint(index);
        if (brushMode === "brush") {
          const row = Math.floor(index / GRID);
          const col = index % GRID;
          for (let r = row - 1; r <= row + 1; r += 1) {
            for (let c = col - 1; c <= col + 1; c += 1) {
              if (r === row && c === col) continue;
              if (r >= 0 && r < GRID && c >= 0 && c < GRID) {
                paint(r * GRID + c);
              }
            }
          }
        }
        return next;
      });
    },
    [selectedColor, brushMode]
  );

  const handleStageClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!selectedSticker) return;
      const target = event.target as HTMLElement;
      if (
        target.closest(".stage-sticker") ||
        target.closest(".friend-chip")
      ) {
        return;
      }

      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      if (
        x < STAGE_PADDING ||
        x > 1 - STAGE_PADDING ||
        y < STAGE_PADDING ||
        y > 1 - STAGE_PADDING
      ) {
        return;
      }
      setPlacements((current) => [
        ...current,
        {
          id: randomId(),
          stickerId: selectedSticker,
          x,
          y,
          scale: 1
        }
      ]);
    },
    [selectedSticker]
  );

  const handleClear = () => {
    setPixels(Array(GRID * GRID).fill(null));
    setPlacements([]);
  };

const friendOptions = useMemo(() => {
  const selectedKeys = new Set(selected.map(assetKey));
  return available.filter((asset) => !selectedKeys.has(assetKey(asset)));
}, [available, selected]);

useEffect(() => {
  setActiveFriends((current) =>
    current.filter((key) =>
      friendOptions.some((asset) => assetKey(asset) === key)
    )
  );
}, [friendOptions]);

  const toggleFriend = (asset: NFTAsset) => {
    const id = `${asset.contractAddress}-${asset.tokenId}`;
    setActiveFriends((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  };

  const updatePlacementScale = (id: string, scale: number) => {
    setPlacements((current) =>
      current.map((placement) =>
        placement.id === id ? { ...placement, scale } : placement
      )
    );
  };

  const removePlacement = (id: string) => {
    setPlacements((current) => current.filter((placement) => placement.id !== id));
  };

  const availableAdds = useMemo(() => [...friendOptions, ...customImages], [
    friendOptions,
    customImages
  ]);

  const activeFriendAssets = availableAdds.filter((asset) =>
    activeFriends.includes(assetKey(asset))
  );

const stageScaleStyle = useMemo(
  () => ({
    transform: `scale(${baseScale})`,
    transformOrigin: "center"
  }),
  [baseScale]
);

  const toStageCoordinate = useCallback(
    (value: number, canvasSize: number, padding: number) => {
      const clamped = clamp(value, STAGE_PADDING, 1 - STAGE_PADDING);
      return (
        padding +
        ((clamped - STAGE_PADDING) / STAGE_RANGE) * (canvasSize - padding * 2)
      );
    },
    []
  );
  const loadImage = useCallback(
    (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
        img.src = src;
      }),
    []
  );

  const renderStageToBlob = useCallback(async () => {
    const canvasSize = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas context 없음");

    const gradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
    gradient.addColorStop(0, "#ffe6fb");
    gradient.addColorStop(1, "#cdbdff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    const paddingPx = STAGE_PADDING * canvasSize;
    const drawSize = canvasSize - paddingPx * 2;

    ctx.save();
    ctx.translate(canvasSize / 2, canvasSize / 2);
    ctx.scale(baseScale, baseScale);
    ctx.translate(-canvasSize / 2, -canvasSize / 2);

    const drawBaseImage = async (asset: NFTAsset | null, size: number) => {
      if (!asset?.image) {
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillRect(paddingPx, paddingPx, size, size);
        return;
      }
      try {
        const img = await loadImage(asset.image);
        const ratio = Math.max(size / img.width, size / img.height);
        const width = img.width * ratio;
        const height = img.height * ratio;
        const x = paddingPx + (size - width) / 2;
        const y = paddingPx + (size - height) / 2;
        ctx.drawImage(img, x, y, width, height);
      } catch {
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillRect(paddingPx, paddingPx, size, size);
      }
    };

    await drawBaseImage(primaryBase, drawSize);

    if (secondaryBases.length) {
      const tileSize = drawSize * 0.18;
      const spacing = tileSize * 0.15;
      const totalWidth =
        secondaryBases.length * tileSize + (secondaryBases.length - 1) * spacing;
      const startX = paddingPx + (drawSize - totalWidth) / 2;
      const y = paddingPx + drawSize - tileSize - 10;
      for (let i = 0; i < secondaryBases.length; i += 1) {
        const asset = secondaryBases[i];
        if (!asset.image) continue;
        try {
          const img = await loadImage(asset.image);
          ctx.save();
          ctx.beginPath();
          ctx.rect(startX + i * (tileSize + spacing), y, tileSize, tileSize);
          ctx.clip();
          ctx.drawImage(img, startX + i * (tileSize + spacing), y, tileSize, tileSize);
          ctx.restore();
        } catch {
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.fillRect(startX + i * (tileSize + spacing), y, tileSize, tileSize);
        }
      }
    }

    const cellSize = drawSize / GRID;
    pixels.forEach((color, index) => {
      if (!color) return;
      const row = Math.floor(index / GRID);
      const col = index % GRID;
      const x = paddingPx + col * cellSize;
      const y = paddingPx + row * cellSize;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, cellSize, cellSize);
    });

    for (const placement of placements) {
      const sticker = stickerMap[placement.stickerId];
      if (!sticker) continue;
      const basePixelSize = (drawSize / GRID) * 0.8;
      const pixelSize =
        (basePixelSize / sticker.map[0].length) * placement.scale;
      const width = sticker.map[0].length * pixelSize;
      const height = sticker.map.length * pixelSize;
      const centerX = toStageCoordinate(placement.x, canvasSize, paddingPx);
      const centerY = toStageCoordinate(placement.y, canvasSize, paddingPx);
      const startX = centerX - width / 2;
      const startY = centerY - height / 2;
      sticker.map.forEach((row, rowIdx) => {
        row.split("").forEach((cell, colIdx) => {
          const color = sticker.palette[cell];
          if (!color || color === "rgba(255, 255, 255, 0)") return;
          ctx.fillStyle = color;
          ctx.fillRect(
            startX + colIdx * pixelSize,
            startY + rowIdx * pixelSize,
            pixelSize,
            pixelSize
          );
        });
      });
    }

    if (activeFriendAssets.length) {
      const size = drawSize * 0.12;
      for (let i = 0; i < activeFriendAssets.length; i += 1) {
        const asset = activeFriendAssets[i];
        const angle =
          (i / Math.max(activeFriendAssets.length, 1)) * Math.PI * 2;
        const normX = 0.5 + 0.35 * Math.cos(angle);
        const normY = 0.5 + 0.35 * Math.sin(angle);
        const x = toStageCoordinate(normX, canvasSize, paddingPx);
        const y = toStageCoordinate(normY, canvasSize, paddingPx);
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        if (asset.image) {
          try {
            const img = await loadImage(asset.image);
            ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
          } catch {
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.fillRect(x - size / 2, y - size / 2, size, size);
          }
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }
        ctx.restore();
      }
    }

    ctx.restore();

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("이미지 생성 실패"));
      }, "image/png");
    });
  }, [
    activeFriendAssets,
    baseScale,
    loadImage,
    pixels,
    placements,
    primaryBase,
    secondaryBases,
    toStageCoordinate
  ]);

  const handleDownloadImage = useCallback(async () => {
    if (!primaryBase) {
      setShareError("최소 한 개의 NFT를 선택해주세요.");
      return;
    }
    setShareError(null);
    setIsSharing(true);
    try {
      const blob = await renderStageToBlob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "monadairy.png";
      link.click();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);
    } catch (error) {
      console.error("share failed", error);
      setShareError("이미지 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSharing(false);
    }
  }, [primaryBase, renderStageToBlob]);

  const handleCustomImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    const newAsset: NFTAsset = {
      tokenId: randomId(),
      contractAddress: "0xcustom-image" as `0x${string}`,
      name: file.name || "Custom Image",
      image: objectUrl
    };
    setCustomImages((prev) => [...prev, newAsset]);
    event.target.value = "";
  };

  const handlePickCustomImage = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveCustomImage = (asset: NFTAsset) => {
    setCustomImages((prev) => {
      const target = prev.find(
        (item) =>
          item.tokenId === asset.tokenId &&
          item.contractAddress === asset.contractAddress
      );
      if (target?.image?.startsWith("blob:")) {
        URL.revokeObjectURL(target.image);
      }
      return prev.filter((item) => item.tokenId !== asset.tokenId);
    });
    setActiveFriends((current) =>
      current.filter((key) => key !== assetKey(asset))
    );
  };

  return (
    <PixelCard title="Pixel Deco Studio" accent="blue" className="studio-card">
      <div className="studio">
        <div className="studio-stage-wrapper">
          <div
            className={clsx("studio-stage", !primaryBase && "studio-stage--empty")}
            ref={stageRef}
            onClick={handleStageClick}
          >
            <div className="stage-cloud stage-cloud--left" />
            <div className="stage-cloud stage-cloud--right" />
            {primaryBase ? (
              <>
                <div className="stage-base">
                  {primaryBase.image ? (
                    <Image
                      src={primaryBase.image}
                      alt={primaryBase.name ?? "선택된 NFT"}
                      fill
                      sizes="320px"
                      style={stageScaleStyle}
                    />
                  ) : (
                    <div className="stage-base__placeholder">
                      이미지가 없어요
                    </div>
                  )}
                </div>
                {secondaryBases.length > 0 && (
                  <div className="stage-base-tiles">
                    {secondaryBases.map((asset) => (
                      <div
                        key={`${asset.contractAddress}-${asset.tokenId}`}
                        className="stage-base-tiles__item"
                      >
                        {asset.image ? (
                          <Image
                            src={asset.image}
                            alt={asset.name ?? "추가 NFT"}
                            fill
                            sizes="100px"
                          />
                        ) : (
                          <span>?</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="stage-pixels" style={stageScaleStyle}>
                  <PixelCanvas
                    cells={pixels}
                    columns={GRID}
                    onCellMouseDown={(idx) => {
                      isPaintingRef.current = true;
                      handlePaint(idx);
                    }}
                    onCellMouseEnter={(idx) => {
                      if (isPaintingRef.current) {
                        handlePaint(idx);
                      }
                    }}
                    onMouseLeave={() => {
                      isPaintingRef.current = false;
                    }}
                  />
                </div>
                <div className="stage-stickers" style={stageScaleStyle}>
                  {placements.map((placement) => {
                    const sticker = stickerMap[placement.stickerId];
                    if (!sticker) return null;
                    return (
                      <div
                        key={placement.id}
                        className="stage-sticker"
                        style={{
                          left: `${placement.x * 100}%`,
                          top: `${placement.y * 100}%`
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          removePlacement(placement.id);
                        }}
                      >
                        <div
                          className="sticker-scale"
                          style={{ transform: `scale(${placement.scale})` }}
                        >
                          <PixelSprite sticker={sticker} scale={6} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="stage-friends" style={stageScaleStyle}>
                  {activeFriendAssets.map((asset, index) => {
                    const angle =
                      (index / Math.max(activeFriendAssets.length, 1)) *
                      Math.PI *
                      2;
                    return (
                      <div
                        key={`${asset.contractAddress}-${asset.tokenId}`}
                        className="friend-chip"
                        style={{
                          transform: "translate(-50%, -50%)",
                          left: `${50 + 35 * Math.cos(angle)}%`,
                          top: `${50 + 35 * Math.sin(angle)}%`
                        }}
                      >
                        {asset.image ? (
                          <Image
                            src={asset.image}
                            alt={asset.name ?? "friend"}
                            fill
                            sizes="80px"
                          />
                        ) : (
                          <span className="friend-chip__placeholder">?</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="studio-stage__helper">
                꾸미고 싶은 NFT를 하나 이상 선택하면 이 공간 안에 불러와집니다.
              </p>
            )}
          </div>
          <div className="studio-actions">
            <PixelButton variant="ghost" onClick={handleClear}>
              전체 리셋
            </PixelButton>
            <PixelButton
              variant="pink"
              loading={isSharing}
              onClick={handleDownloadImage}
            >
              이미지 저장
            </PixelButton>
            <div className="hint">
              스티커 선택 후 무대 빈 공간을 클릭하면 추가되고, 스티커를 다시 누르면
              삭제돼요.
            </div>
            <div className="brush-toggle">
              <span>붓펜: {brushMode === "brush" ? "ON" : "OFF"}</span>
              <PixelButton
                variant={brushMode === "brush" ? "pink" : "ghost"}
                onClick={() =>
                  setBrushMode((prev) => (prev === "brush" ? "pixel" : "brush"))
                }
              >
                {brushMode === "brush" ? "붓펜 끄기" : "붓펜 켜기"}
              </PixelButton>
            </div>
          </div>
          <div className="scale-controls">
            <label>
              NFT 크기
              <input
                type="range"
                min="0.6"
                max="1.4"
                step="0.05"
                value={baseScale}
                onChange={(event) => setBaseScale(Number(event.target.value))}
              />
            </label>
            <PixelButton variant="ghost" onClick={() => setBaseScale(1)}>
              크기 초기화
            </PixelButton>
          </div>
          {shareError && <p className="share-error">{shareError}</p>}
        </div>

        <div className="studio-controls">
          <section>
            <h3>1. 스티커</h3>
            <StickerPalette
              selected={selectedSticker}
              onSelect={setSelectedSticker}
            />
            {selectedSticker && (
              <PixelButton
                variant="ghost"
                className="palette-reset"
                onClick={() => setSelectedSticker(null)}
              >
                스티커 선택 해제
              </PixelButton>
            )}
          </section>
          <section>
            <h3>2. 픽셀 낙서</h3>
            <ColorPalette
              colors={COLORS}
              selected={selectedColor}
              onSelect={setSelectedColor}
            />
            <p className="hint">
              색을 고른 뒤 NFT 위의 픽셀 그리드 아무 곳이나 클릭해보세요.
            </p>
            <PixelButton
              variant="ghost"
              className="palette-reset"
              onClick={() => setSelectedColor(COLORS[0])}
            >
              색상 초기화
            </PixelButton>
            <div className="brush-tools">
              <PixelButton
                variant={brushMode === "pixel" ? "pink" : "ghost"}
                onClick={() => setBrushMode("pixel")}
              >
                픽셀 펜
              </PixelButton>
              <PixelButton
                variant={brushMode === "brush" ? "pink" : "ghost"}
                onClick={() => setBrushMode("brush")}
              >
                브러시
              </PixelButton>
            </div>
          </section>
          <section>
            <h3>3. NFT 콜라주</h3>
            <p className="hint">
              그리드에서 추가로 선택한 NFT나 직접 업로드한 이미지를 아래에서
              토글해보세요.
            </p>
            <div className="custom-image-form">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomImageChange}
                hidden
              />
              <PixelButton variant="pink" onClick={handlePickCustomImage}>
                이미지 파일 추가
              </PixelButton>
              <span className="custom-image-hint">PNG/JPG 가능</span>
            </div>
            <div className="collage-strip__items">
              {availableAdds.map((asset) => {
                const id = assetKey(asset);
                const isOn = activeFriends.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    className={clsx(
                      "collage-token",
                      isOn && "collage-token--on"
                    )}
                    onClick={() => toggleFriend(asset)}
                  >
                    {asset.image ? (
                      <Image
                        src={asset.image}
                        alt={asset.name ?? "friend"}
                        fill
                        sizes="64px"
                      />
                    ) : (
                      <div className="collage-token__placeholder">?</div>
                    )}
                    <span className="collage-token__ring" />
                    {asset.contractAddress === "0xcustom-image" && (
                      <span
                        className="custom-remove"
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemoveCustomImage(asset);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleRemoveCustomImage(asset);
                          }
                        }}
                      >
                        x
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {activeFriends.length > 0 && (
              <PixelButton
                variant="ghost"
                className="palette-reset"
                onClick={() => setActiveFriends([])}
              >
                이미지 선택 해제
              </PixelButton>
            )}
          </section>
          <section>
            <h3>4. 스티커 편집</h3>
            {placements.length === 0 ? (
              <p className="hint">무대 위 스티커를 선택하면 이곳에서 크기를 조정할 수 있어요.</p>
            ) : (
              <div className="sticker-edit-list">
                {placements.map((placement) => (
                  <div key={placement.id} className="sticker-edit-item">
                    <span>스티커 #{placement.id.slice(0, 4)}</span>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.05"
                      value={placement.scale}
                      onChange={(event) =>
                        updatePlacementScale(placement.id, Number(event.target.value))
                      }
                    />
                    <PixelButton
                      variant="ghost"
                      onClick={() => removePlacement(placement.id)}
                    >
                      제거
                    </PixelButton>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </PixelCard>
  );
});
