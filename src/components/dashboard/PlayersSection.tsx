"use client";

import { useMemo, useState } from "react";
import type { FollowedPlayer, FollowedTeam } from "@/lib/types";
import { playerSections } from "@/lib/players";
import { cn } from "@/lib/utils";
import { PlayerCardView } from "./PlayerCardView";

/* Your Players, under the team each plays for. A team's rule folds its players
   away and, folded, still says how many there are. Folds last until you leave
   the page — how you're reading it now isn't a setting. */

export function PlayersSection({
  players,
  teams,
  onOpen,
}: {
  players: FollowedPlayer[];
  teams: FollowedTeam[];
  onOpen: (player: FollowedPlayer) => void;
}) {
  const sections = useMemo(() => playerSections(players, teams), [players, teams]);
  const [folded, setFolded] = useState<Set<string>>(() => new Set());

  function toggle(key: string) {
    setFolded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      {sections.map((section) => {
        const isFolded = folded.has(section.key);
        return (
          <div key={section.key}>
            <button
              type="button"
              onClick={() => toggle(section.key)}
              aria-expanded={!isFolded}
              className="group mb-3 flex w-full items-center gap-2.5 rounded-md py-1 text-left"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: section.color }} aria-hidden />
              <span className="truncate font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted group-hover:text-ink">
                {section.title}
              </span>
              <span className="shrink-0 font-mono text-[10.5px] font-semibold tracking-[0.08em] text-faint">
                {isFolded ? `${section.abbr} · ${section.players.length}` : section.abbr}
              </span>
              <span className="h-px flex-1 bg-line-soft/80" aria-hidden />
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className={cn(
                  "shrink-0 text-faint transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:text-ink",
                  isFolded ? "-rotate-90" : "rotate-0",
                )}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {!isFolded && (
              <div className="grid gap-4 sm:grid-cols-2">
                {section.players.map((p) => (
                  <PlayerCardView key={`${p.league}:${p.id}`} follow={p} onOpen={() => onOpen(p)} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
