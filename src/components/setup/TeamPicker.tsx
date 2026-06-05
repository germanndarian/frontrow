"use client";

import { useMemo, useState } from "react";
import type { CatalogTeam } from "@/lib/catalog";
import type { FollowedTeam, LeagueId } from "@/lib/types";
import { LEAGUES } from "@/lib/leagues";
import { useCatalogTeams } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/ui/SearchInput";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { CheckMark } from "./CheckMark";

function TeamTile({
  team,
  selected,
  onToggle,
}: {
  team: CatalogTeam;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md border p-2.5 text-left",
        "transition-[transform,background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]",
        selected
          ? "border-primary/60 bg-primary/[0.1]"
          : "border-line/70 bg-surface/50 hover:border-line hover:bg-surface-2/60",
      )}
    >
      <TeamLogo src={team.logo} name={team.displayName} abbr={team.abbreviation} color={team.color} size={30} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-ink">{team.name}</span>
        <span className="block truncate text-[11.5px] text-faint">{team.displayName.replace(` ${team.name}`, "")}</span>
      </span>
      <CheckMark active={selected} />
    </button>
  );
}

export function TeamPicker({
  leagues,
  selected,
  onToggle,
}: {
  leagues: LeagueId[];
  selected: FollowedTeam[];
  onToggle: (team: FollowedTeam) => void;
}) {
  const { data, isPending, isError, refetch } = useCatalogTeams(leagues);
  const [q, setQ] = useState("");

  const selectedKeys = useMemo(
    () => new Set(selected.map((t) => `${t.league}:${t.teamId}`)),
    [selected],
  );

  const grouped = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    return leagues
      .map((league) => ({
        league,
        teams: data.filter(
          (t) =>
            t.league === league &&
            (!needle ||
              t.displayName.toLowerCase().includes(needle) ||
              t.abbreviation.toLowerCase().includes(needle)),
        ),
      }))
      .filter((g) => g.teams.length > 0);
  }, [data, leagues, q]);

  return (
    <div className="space-y-4">
      <SearchInput value={q} onChange={setQ} placeholder="Search teams…" />

      {isError ? (
        <ErrorState onRetry={() => refetch()} message="Couldn't load teams." />
      ) : isPending ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-[58px] rounded-md" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState title="No teams match" body={`Nothing for “${q}”. Try a different name or abbreviation.`} />
      ) : (
        <div className="max-h-[46vh] space-y-5 overflow-y-auto pr-1 sm:max-h-[40vh]">
          {grouped.map((g) => (
            <div key={g.league}>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">
                {LEAGUES[g.league].name}
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {g.teams.map((team) => (
                  <TeamTile
                    key={team.teamId}
                    team={team}
                    selected={selectedKeys.has(`${team.league}:${team.teamId}`)}
                    onToggle={() => onToggle(team)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
