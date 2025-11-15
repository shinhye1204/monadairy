"use client";

import clsx from "clsx";

type Props = {
  colors: string[];
  selected: string | null;
  onSelect: (color: string) => void;
};

export function ColorPalette({ colors, selected, onSelect }: Props) {
  return (
    <div className="color-palette">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          className={clsx(
            "color-swatch",
            selected === color && "color-swatch--active"
          )}
          style={{ background: color }}
          onClick={() => onSelect(color)}
        />
      ))}
    </div>
  );
}
