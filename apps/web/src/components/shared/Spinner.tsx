"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: number | string;
}

export const Spinner = ({ className, size = 24 }: SpinnerProps) => {
  const pxSize = typeof size === "number" ? `${size}px` : size;

  // Larger loaders are rendered as modern 3-dot pulsing loaders
  // Small loaders (like inside buttons) are rendered as a beautiful custom circular arc
  const isLarge = typeof size === "number" ? size >= 32 : true;

  if (!isLarge) {
    return (
      <div
        style={{ width: pxSize, height: pxSize }}
        className={cn(
          "inline-block rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0",
          className
        )}
        role="status"
        aria-label="loading"
      />
    );
  }

  const dotSize = typeof size === "number" ? `${size / 4}px` : "10px";
  const gapSize = typeof size === "number" ? `${size / 6}px` : "6px";

  return (
    <div
      style={{ gap: gapSize }}
      className={cn("inline-flex items-center justify-center shrink-0", className)}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="rounded-full bg-primary animate-bounce"
          style={{
            width: dotSize,
            height: dotSize,
            animationDelay: `${i * 0.15}s`,
            animationDuration: "1s",
          }}
        />
      ))}
    </div>
  );
};
