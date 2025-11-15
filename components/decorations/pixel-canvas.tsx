"use client";

import clsx from "clsx";

type Props = {
  cells: (string | null)[];
  columns: number;
  onCellMouseDown: (index: number) => void;
  onCellMouseEnter?: (index: number) => void;
  onMouseLeave?: () => void;
};

export function PixelCanvas({
  cells,
  columns,
  onCellMouseDown,
  onCellMouseEnter,
  onMouseLeave
}: Props) {
  return (
    <div
      className="pixel-canvas"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      onMouseLeave={onMouseLeave}
    >
      {cells.map((color, index) => (
        <button
          type="button"
          key={index}
          className={clsx("pixel-cell", color && "pixel-cell--filled")}
          style={{
            background: color ?? "transparent"
          }}
          onMouseDown={(event) => {
            event.preventDefault();
            onCellMouseDown(index);
          }}
          onMouseEnter={() => {
            onCellMouseEnter?.(index);
          }}
        />
      ))}
    </div>
  );
}
