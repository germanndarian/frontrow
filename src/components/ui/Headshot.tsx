"use client";

import { useState } from "react";
import { cn, monogram } from "@/lib/utils";

interface HeadshotProps {
  src?: string;
  name: string;
  color?: string;
  size?: number;
  className?: string;
}

/**
 * Player headshot with a colored-initials fallback. ESPN cuts headshots with a
 * transparent background, so we sit them on a subtle team-tinted plate.
 */
export function Headshot({
  src,
  name,
  color = "#64748b",
  size = 64,
  className,
}: HeadshotProps) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-end justify-center overflow-hidden rounded-full",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(120% 120% at 50% 15%, color-mix(in oklab, ${color} 45%, transparent), color-mix(in oklab, ${color} 16%, transparent))`,
      }}
    >
      {showFallback ? (
        <span
          className="flex h-full w-full items-center justify-center font-display font-bold text-ink/90"
          style={{ fontSize: size * 0.34 }}
          aria-hidden
        >
          {monogram(name)}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover object-top"
        />
      )}
    </span>
  );
}
