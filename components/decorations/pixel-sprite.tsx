import { PixelSticker } from "@/data/stickers";

type Props = {
  sticker: PixelSticker;
  scale?: number;
};

export function PixelSprite({ sticker, scale = 4 }: Props) {
  return (
    <div
      className="pixel-sprite"
      style={{
        gridTemplateColumns: `repeat(${sticker.map[0].length}, ${scale}px)`
      }}
    >
      {sticker.map.map((row, rowIndex) =>
        row.split("").map((cell, cellIndex) => (
          <span
            key={`${sticker.id}-${rowIndex}-${cellIndex}`}
            style={{
              width: scale,
              height: scale,
              background: sticker.palette[cell] ?? "transparent"
            }}
          />
        ))
      )}
    </div>
  );
}
