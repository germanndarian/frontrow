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
        "flex w-full items-center gap-3 rounded-md border p-2.5 text-left",
        "transition-[transform,background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.99]",
        selected
          ? "border-primary/60 bg-primary/[0.1]"
          : "border-line/70 bg-surface/50 hover:border-line hover:bg-surface-2/60",
      )}
    >
      <Headshot src={player.headshot} name={player.fullName} size={38} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold text-ink">
          {player.fullName}
        </span>
        <span className="text-[12px] text-faint">{player.position || "—"}</span>
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
            <Skeleton key={i} className="h-[62px] rounded-md" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState
          title="No players match"
          body={q ? `Nothing for “${q}”.` : "No rosters available for your teams right now."}
        />
      ) : (
        <div className="max-h-[44vh] space-y-5 overflow-y-auto pr-1 sm:max-h-[38vh]">
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
