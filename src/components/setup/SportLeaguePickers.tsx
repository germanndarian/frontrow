"use client";

import type { LeagueId, SportId } from "@/lib/types";
import { LEAGUES, SPORTS, SPORT_ORDER, leaguesForSports } from "@/lib/leagues";
import { cn } from "@/lib/utils";
import { CheckMark } from "./CheckMark";

/* The sport and league pickers: tappable rows with a 44px mark, a name and a
   line under it, and a check. Setup's first two steps, and the Sports and
   Leagues tabs of Settings' follow editor — the same rows in both places. */

/* Mark-tile colours from the mockup, keyed by sport and league. */
const SPORT_MARK: Record<SportId, string> = { football: "#5a1414", basketball: "#c8512b", baseball: "#0c2340", hockey: "#1d3557" };
const LEAGUE_MARK: Record<LeagueId, string> = { nfl: "#5a1414", "college-football": "#bf5700", nba: "#c8512b", mlb: "#0c2340", nhl: "#1d3557" };
const LEAGUE_TAG: Record<LeagueId, string> = { nfl: "NFL", "college-football": "NCAA", nba: "NBA", mlb: "MLB", nhl: "NHL" };

function SportGlyph({ sport }: { sport: SportId }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;
  if (sport === "football")
    return (
      <svg {...common}>
        <ellipse cx="12" cy="12" rx="9" ry="5.5" transform="rotate(-30 12 12)" />
        <path d="M9.5 14.5 14.5 9.5M10.5 11.5l1 1M12.5 9.5l1 1M11.5 12.5l1 1" />
      </svg>
    );
  if (sport === "baseball")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M6.5 5.8c2 1.6 3 4 3 6.2s-1 4.6-3 6.2M17.5 5.8c-2 1.6-3 4-3 6.2s1 4.6 3 6.2" />
      </svg>
    );
  if (sport === "basketball")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18M3 12h18M5.6 5.6c2.4 2 3.9 4.8 3.9 6.4s-1.5 4.4-3.9 6.4M18.4 5.6c-2.4 2-3.9 4.8-3.9 6.4s1.5 4.4 3.9 6.4" />
      </svg>
    );
  return (
    <svg {...common}>
      <ellipse cx="12" cy="15" rx="8" ry="3" />
      <path d="M4 12.5v2.5M20 12.5v2.5M12 12v6" strokeWidth="1.4" opacity="0.5" />
      <ellipse cx="12" cy="12" rx="8" ry="3" />
    </svg>
  );
}

/** One tappable row: a 44px mark, a name and a line under it, and a check. */
export function PickRow({ active, onToggle, mark, name, sub }: { active: boolean; onToggle: () => void; mark: React.ReactNode; name: string; sub: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-[18px] border p-[15px] text-left",
        "transition-[transform,background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]",
        active ? "border-primary/55 bg-primary/8" : "border-line bg-surface hover:bg-surface-2/60",
      )}
    >
      {mark}
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[16px] font-bold text-ink">{name}</span>
        <span className="mt-0.5 block truncate text-[12.5px] text-faint">{sub}</span>
      </span>
      <CheckMark active={active} />
    </button>
  );
}

function Mark({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="grid h-11 w-11 flex-none place-items-center rounded-[13px] font-mono text-[10px] font-bold text-white" style={{ background: color }}>
      {children}
    </span>
  );
}

export function SportPicker({ selected, onToggle }: { selected: SportId[]; onToggle: (sport: SportId) => void }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {SPORT_ORDER.map((s) => (
        <PickRow
          key={s}
          active={selected.includes(s)}
          onToggle={() => onToggle(s)}
          mark={<Mark color={SPORT_MARK[s]}><SportGlyph sport={s} /></Mark>}
          name={SPORTS[s].name}
          sub={SPORTS[s].leagues.map((l) => LEAGUES[l].name).join(" · ")}
        />
      ))}
    </div>
  );
}

/** The leagues of the sports picked, and where each season is. */
export function LeaguePicker({
  sports,
  selected,
  onToggle,
}: {
  sports: SportId[];
  selected: LeagueId[];
  onToggle: (league: LeagueId) => void;
}) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {leaguesForSports(sports).map((l) => {
        const meta = LEAGUES[l];
        return (
          <PickRow
            key={l}
            active={selected.includes(l)}
            onToggle={() => onToggle(l)}
            mark={<Mark color={LEAGUE_MARK[l]}>{LEAGUE_TAG[l]}</Mark>}
            name={meta.name}
            sub={`${meta.fullName} · ${meta.inSeason ? "In season" : meta.seasonHint}`}
          />
        );
      })}
    </div>
  );
}
