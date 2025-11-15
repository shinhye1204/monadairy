"use client";

import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

type PixelButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "pink" | "purple" | "ghost";
  block?: boolean;
  loading?: boolean;
};

export function PixelButton({
  variant = "pink",
  block,
  loading,
  className,
  children,
  disabled,
  ...props
}: PixelButtonProps) {
  return (
    <button
      type="button"
      className={clsx(
        "pixel-button",
        `pixel-button--${variant}`,
        block && "pixel-button--block",
        (disabled || loading) && "pixel-button--disabled",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      <span className="pixel-button__layer">
        <span className="pixel-button__content">
          {loading ? "..." : children}
        </span>
      </span>
    </button>
  );
}
