"use client";

import { useMemo } from "react";
import type { LeagueId, ScheduleGame } from "@/lib/types";
import { useSchedule } from "@/lib/queries";
import { cn, clockTime, shortDate } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { OutcomeChip } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";

function Row({ game }: { game: ScheduleGame }) {
  return (
    <div className="flex items-center gap-3 px-5 py-2.5">
      <div className="w-12 shrink-0 text-[11px] font-medium text-faint tnum">
        {shortDate(game.date)}
      </div>
      <span className="w-6 shrink-0 text-center text-[12px] text-faint">{game.atVs}</span>
      <TeamLogo
        src={game.opponentLogo}
        name={game.opponentName}
        abbr={game.opponentAbbr}
        size={22}
      />
      <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">
        {game.opponentAbbr || game.opponentName}
      </span>
      {game.state === "post" ? (
        <div className="flex items-center gap-2">
          <span className="tnum text-[12.5px] font-semibold text-muted">{game.score}</span>
          {game.result && <OutcomeChip result={game.result} />}
        </div>
      ) : (
        <div className="text-right text-[12px]">
          <div className="font-semibold text-ink">{clockTime(game.date)}</div>
          {game.broadcast && <div className="text-faint">{game.broadcast}</div>}
        </div>
      )}
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-[1] bg-surface/95 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-faint backdrop-blur">
      {children}
    </div>
  );
}

export function ScheduleModal({
  open,
  onClose,
  league,
  teamId,
  teamName,
  teamLogo,
  teamAbbr,
  teamColor,
}: {
  open: boolean;
  onClose: () => void;
  league: LeagueId;
  teamId: string;
  teamName: string;
  teamLogo: string;
  teamAbbr: string;
  teamColor: string;
}) {
  const { data, isPending, isError, refetch } = useSchedule(league, teamId, open);

  const { upcoming, recent } = useMemo(() => {
    const games = data ?? [];
    return {
      upcoming: games.filter((g) => g.state === "pre"),
      // Most recent result first.
      recent: games.filter((g) => g.state === "post").reverse(),
    };
  }, [data]);

  const titleId = `schedule-${teamId}`;

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-t-xl border border-line/70 bg-surface shadow-2xl sm:rounded-xl">
        {/* Header */}
        <div className="relative flex items-center gap-3 border-b border-line-soft/70 px-5 py-4">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background: `linear-gradient(105deg, color-mix(in oklab, ${teamColor} 22%, transparent), transparent 60%)`,
            }}
          />
          <TeamLogo src={teamLogo} name={teamName} abbr={teamAbbr} color={teamColor} size={34} className="relative" />
          <div className="relative min-w-0 flex-1">
            <h2 id={titleId} className="truncate font-display text-[16px] font-extrabold text-ink">
              {teamName}
            </h2>
            <p className="text-[12px] text-faint">Full schedule</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close schedule"
            className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-faint transition-[transform,background-color,color] duration-150 hover:bg-surface-2 hover:text-ink active:scale-90"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto py-1">
          {isPending ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} message="Couldn't load the schedule." />
          ) : upcoming.length === 0 && recent.length === 0 ? (
            <EmptyState title="No games scheduled" body="There's nothing on the calendar right now." />
          ) : (
            <>
              {upcoming.length > 0 && (
                <section>
                  <GroupLabel>Upcoming · {upcoming.length}</GroupLabel>
                  <div className="divide-y divide-line-soft/40">
                    {upcoming.map((g) => (
                      <Row key={g.id} game={g} />
                    ))}
                  </div>
                </section>
              )}
              {recent.length > 0 && (
                <section className={cn(upcoming.length > 0 && "mt-1")}>
                  <GroupLabel>Results · {recent.length}</GroupLabel>
                  <div className="divide-y divide-line-soft/40">
                    {recent.map((g) => (
                      <Row key={g.id} game={g} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
