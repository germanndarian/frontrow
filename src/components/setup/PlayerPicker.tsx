"use client";

import { useMemo, useState } from "react";
import type { CatalogPlayer } from "@/lib/catalog";
import type { FollowedPlayer, FollowedTeam } from "@/lib/types";
import { useRosters } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/ui/SearchInput";
import { Headshot } from "@/components/ui/Headshot";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { CheckMark } from "./CheckMark";

function PlayerRow({
  player,
  selected,
  onToggle,
}: {
  player: CatalogPlayer;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-[18px] border p-[15px] text-left",
        "transition-[transform,background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]",
        selected ? "border-primary/55 bg-primary/8" : "border-line bg-surface hover:bg-surface-2/60",
      )}
    >
      <Headshot src={player.headshot} name={player.fullName} size={44} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[16px] font-bold text-ink">{player.fullName}</span>
        <span className="mt-0.5 block text-[12.5px] text-faint">{player.position || "—"}</span>
      </span>
      <CheckMark active={selected} />
    </button>
  );
}

export function PlayerPicker({
  teams,
  selected,
  onToggle,
}: {
  teams: FollowedTeam[];
  selected: FollowedPlayer[];
  onToggle: (player: FollowedPlayer) => void;
}) {
  const { data, isPending, isError, refetch } = useRosters(teams);
  const [q, setQ] = useState("");

  const selectedIds = useMemo(() => new Set(selected.map((p) => p.id)), [selected]);

  const grouped = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    return teams
      .map((team) => ({
        team,
        players: data.filter(
          (p) =>
            p.teamId === team.teamId &&
            (!needle ||
              p.fullName.toLowerCase().includes(needle) ||
              p.position.toLowerCase().includes(needle)),
        ),
      }))
      .filter((g) => g.players.length > 0);
  }, [data, teams, q]);

  return (
    <div className="space-y-4">
      <SearchInput value={q} onChange={setQ} placeholder="Search players…" />

      {isError ? (
        <ErrorState onRetry={() => refetch()} message="Couldn't load rosters." />
      ) : isPending ? (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[76px] rounded-[18px]" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState
          title="No players match"
          body={q ? `Nothing for “${q}”.` : "No rosters available for your teams right now."}
        />
      ) : (
        <div className="space-y-5">
          {grouped.map(({ team, players }) => (
            <div key={`${team.league}:${team.teamId}`}>
              <div className="mb-2 flex items-center gap-2">
                <TeamLogo
                  src={team.logo}
                  name={team.displayName}
                  abbr={team.abbreviation}
                  color={team.color}
                  size={18}
                />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">
                  {team.displayName}
                </span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {players.map((player) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    selected={selectedIds.has(player.id)}
                    onToggle={() => onToggle(player)}
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
