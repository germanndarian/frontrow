"use client";

import { useState } from "react";
import { cn, monogram } from "@/lib/utils";

interface TeamLogoProps {
  src?: string;
  name: string;
  abbr?: string;
  color?: string;
  size?: number;
  className?: string;
}

/**
 * Team crest with a graceful fallback. If the remote logo fails (or is missing)
 * we render a tinted monogram derived from the team's own color, so the grid
 * never shows a broken-image glyph.
 */
export function TeamLogo({
  src,
  name,
  abbr,
  color = "#64748b",
  size = 28,
  className,
}: TeamLogoProps) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {showFallback ? (
        <span
          className="flex h-full w-full items-center justify-center rounded-[28%] font-display font-bold leading-none"
          style={{
            fontSize: size * 0.4,
            color: "#fff",
            background: `linear-gradient(150deg, ${color}, color-mix(in oklab, ${color} 55%, #000))`,
          }}
          aria-hidden
        >
          {abbr ?? monogram(name)}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${name} logo`}
          width={size}
          height={size}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain"
        />
      )}
    </span>
  );
}
