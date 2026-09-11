"use client";

import { cn } from "@/lib/utils";

/** A circular check that scales in when selected; empty ring when not. */
export function CheckMark({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "grid h-6 w-6 shrink-0 place-items-center rounded-full border-[1.5px] transition-[background-color,border-color] duration-150",
        active ? "border-primary bg-primary" : "border-line bg-transparent",
      )}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          "text-primary-ink transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
          active ? "scale-100" : "scale-0",
        )}
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}
