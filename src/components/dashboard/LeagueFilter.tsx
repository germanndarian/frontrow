"use client";

import { motion } from "motion/react";
import { LEAGUES } from "@/lib/leagues";
import type { LeagueId } from "@/lib/types";
import { cn } from "@/lib/utils";

export type LeagueFilterValue = "all" | LeagueId;

export function LeagueFilter({
  leagues,
  value,
  onChange,
}: {
  leagues: LeagueId[];
  value: LeagueFilterValue;
  onChange: (v: LeagueFilterValue) => void;
}) {
  const options: { id: LeagueFilterValue; label: string }[] = [
    { id: "all", label: "All" },
    ...leagues.map((l) => ({ id: l as LeagueFilterValue, label: LEAGUES[l].name })),
  ];

  return (
    <div
      role="tablist"
      aria-label="Filter by league"
      className="no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-line/70 bg-bg-2/60 p-1"
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              "relative shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-150",
              "active:scale-[0.97]",
              active ? "text-primary-ink" : "text-muted hover:text-ink",
            )}
            style={{ transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)" }}
          >
            {active && (
              <motion.span
                layoutId="league-filter-pill"
                className="absolute inset-0 -z-10 rounded-full bg-primary"
                transition={{ type: "spring", duration: 0.4, bounce: 0.18 }}
              />
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
