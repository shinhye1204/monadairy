import clsx from "clsx";
import { PropsWithChildren } from "react";

type PixelCardProps = PropsWithChildren<{
  className?: string;
  title?: string;
  accent?: "pink" | "blue" | "violet";
  subtle?: boolean;
}>;

export function PixelCard({
  className,
  children,
  title,
  accent = "pink",
  subtle
}: PixelCardProps) {
  return (
    <div
      className={clsx(
        "pixel-card",
        `pixel-card--${accent}`,
        subtle && "pixel-card--subtle",
        className
      )}
    >
      {title && <div className="pixel-card__title">{title}</div>}
      {children}
    </div>
  );
}
