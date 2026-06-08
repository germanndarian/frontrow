"use client";

import type { LeagueId } from "@/lib/types";
import { LEAGUES } from "@/lib/leagues";
import { usePlayoffBracket } from "@/lib/queries";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Bracket } from "./Bracket";

export function BracketModal({
  open,
  onClose,
  league,
  teamId,
  teamColor,
}: {
  open: boolean;
  onClose: () => void;
  league: LeagueId;
  teamId: string;
  teamColor: string;
}) {
  const { data, isPending, isError, refetch } = usePlayoffBracket(league);
  const titleId = `bracket-${league}`;
  const hasBracket = (data?.rounds.length ?? 0) > 0;

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} className="max-w-3xl">
      <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-t-xl border border-line/70 bg-surface shadow-2xl sm:rounded-xl">
        {/* Header */}
        <div className="relative flex items-center gap-3 border-b border-line-soft/70 px-5 py-4">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background: `linear-gradient(105deg, color-mix(in oklab, ${teamColor} 20%, transparent), transparent 60%)`,
            }}
          />
          <div className="relative min-w-0 flex-1">
            <h2 id={titleId} className="truncate font-display text-[16px] font-extrabold text-ink">
              {data?.name || `${LEAGUES[league].name} Playoffs`}
            </h2>
            <p className="text-[12px] text-faint">Your path is highlighted</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close bracket"
            className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-faint transition-[transform,background-color,color] duration-150 hover:bg-surface-2 hover:text-ink active:scale-90"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {isPending ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-40 w-full" />
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} message="Couldn't load the bracket." />
          ) : hasBracket ? (
            <Bracket bracket={data!} followedTeamId={teamId} />
          ) : (
            <EmptyState
              title="No active bracket"
              body="The playoffs for this league aren't underway right now."
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
