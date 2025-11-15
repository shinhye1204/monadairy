"use client";

import clsx from "clsx";
import { STICKER_LIBRARY } from "@/data/stickers";
import { PixelSprite } from "./pixel-sprite";

type Props = {
  selected?: string | null;
  onSelect: (id: string | null) => void;
};

export function StickerPalette({ selected, onSelect }: Props) {
  return (
    <div className="sticker-palette">
      {STICKER_LIBRARY.map((sticker) => (
        <button
          key={sticker.id}
          type="button"
          className={clsx(
            "sticker-chip",
            selected === sticker.id && "sticker-chip--active"
          )}
          onClick={() => onSelect(selected === sticker.id ? null : sticker.id)}
        >
          <PixelSprite sticker={sticker} scale={4} />
          <span>{sticker.name}</span>
        </button>
      ))}
    </div>
  );
}
