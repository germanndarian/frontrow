"use client";

import { AnimatePresence, motion } from "motion/react";
import type { GameSide, PlayByPlay } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";

export function PlayByPlayFeed({
  plays,
  home,
  away,
  live,
}: {
  plays: PlayByPlay[];
  home: GameSide;
  away: GameSide;
  live: boolean;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Play-by-Play"
        eyebrow={live ? "Updating live" : "Full game"}
        action={
          live ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-live">
              <span className="live-dot" />
              Live
            </span>
          ) : undefined
        }
      />
      {plays.length === 0 ? (
        <EmptyState
          title="No plays available"
          body="ESPN provides play-by-play once a game tips off; it's also pruned from older games."
        />
      ) : (
        <ol className="no-scrollbar max-h-[480px] overflow-y-auto px-2 py-1">
          <AnimatePresence initial={false}>
            {plays.map((p) => {
              const isHome = p.teamAbbr === home.abbreviation;
              const isAway = p.teamAbbr === away.abbreviation;
              const tint = isHome
                ? home.color
                : isAway
                  ? away.color
                  : "var(--color-line)";
              return (
                <motion.li
                  key={p.id || `${p.seq}-${p.clock}`}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-3 border-b border-line-soft/60 px-3 py-2.5 last:border-0"
                >
                  <span
                    className="mt-1.5 h-8 w-[3px] shrink-0 rounded-full"
                    style={{ backgroundColor: tint }}
                    aria-hidden
                  />
                  <div className="w-12 shrink-0 pt-0.5 text-center">
                    <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-faint">
                      {p.periodLabel}
                    </div>
                    <div className="tnum font-mono text-[11px] text-muted">{p.clock}</div>
                  </div>
                  <p
                    className={cn(
                      "min-w-0 flex-1 text-[13px] leading-snug",
                      p.scoring ? "font-semibold text-ink" : "text-muted",
                    )}
                  >
                    {p.text}
                  </p>
                  {p.scoring && p.homeScore != null && p.awayScore != null && (
                    <span className="tnum shrink-0 font-mono text-[12px] font-semibold text-primary-bright">
                      {p.homeScore}–{p.awayScore}
                    </span>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      )}
    </Card>
  );
}
