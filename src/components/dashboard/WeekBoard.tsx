"use client";

import { useMemo } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { Game } from "@/lib/types";
import {
  boardGroups,
  emptyBoard,
  groupCount,
  isFollowed,
  isLeagueView,
  visibleGames,
  weekNote,
  type BoardFilter,
} from "@/lib/scores";
import { weekLabel, weekRange, type WeekWindow } from "@/lib/week";
import { cn } from "@/lib/utils";
import { GameCard } from "./GameCard";
import { Card } from "@/components/ui/Card";
import { HScroller } from "@/components/ui/HScroller";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState, Spinner } from "@/components/ui/States";

/* Live & Upcoming, a week at a time: the week chips, where the football season
   is, and a row each for the live games, the upcoming ones and the results.
   Each row scrolls sideways, so the section never grows taller than three rows
   however many games the week holds. The iPhone app's Scores tab, laid out for
   a dashboard. */

const ROW_LABEL: Record<Game["state"], string> = { in: "Live now", pre: "Upcoming", post: "Results" };

export function WeekBoard({
  weeks,
  week,
  onWeek,
  board,
  filter,
  followedKeys,
  pinned,
  onOpen,
}: {
  weeks: WeekWindow[];
  week: WeekWindow;
  onWeek: (offset: number) => void;
  board: UseQueryResult<Game[]>;
  filter: BoardFilter;
  followedKeys: Set<string>;
  pinned: Set<string>;
  onOpen: (game: Game) => void;
}) {
  const games = useMemo(
    () => visibleGames(board.data ?? [], filter, followedKeys),
    [board.data, filter, followedKeys],
  );
  const groups = useMemo(
    () => boardGroups(games, { filter, followed: followedKeys, pinned }),
    [games, filter, followedKeys, pinned],
  );
  const note = weekNote(games);
  const liveCount = games.filter((g) => g.state === "in").length;
  const leagueView = isLeagueView(filter);

  return (
    <div>
      <HScroller role="tablist" label="Choose a week" className="-mx-4 px-4 sm:mx-0 sm:px-0" innerClassName="gap-1.5 py-0.5">
        {weeks.map((w) => {
          const on = w.offset === week.offset;
          return (
            <button
              key={w.offset}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onWeek(w.offset)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold",
                "transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.96]",
                on
                  ? "border-primary/60 bg-primary/12 text-primary-bright"
                  : "border-line/70 bg-surface/60 text-muted hover:border-line hover:text-ink",
              )}
            >
              {weekLabel(w)}
            </button>
          );
        })}
      </HScroller>

      {note && <p className="mt-2 text-[12px] font-semibold text-primary-bright">{note}</p>}

      {board.isLoading ? (
        <BoardSkeleton />
      ) : board.isError && !board.data ? (
        <Card className="mt-4">
          <ErrorState onRetry={() => board.refetch()} />
        </Card>
      ) : groups.length === 0 ? (
        <Card className="mt-4">
          <EmptyState
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M3 10h18M8 4v16" />
              </svg>
            }
            {...emptyBoard(filter, followedKeys.size > 0, weekRange(week))}
          />
        </Card>
      ) : (
        <div className="mt-4 space-y-5">
          {groups.map((group) => {
            const yours = leagueView && group.yours > 0;
            return (
              <section key={group.key} aria-label={ROW_LABEL[group.key]}>
                <div
                  className={cn(
                    "mb-2.5 flex items-center gap-2.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.12em]",
                    yours ? "text-primary-bright" : "text-faint",
                  )}
                >
                  <span>
                    {group.title} · {groupCount(group, filter)}
                  </span>
                  <span className={cn("h-px flex-1", yours ? "bg-primary/35" : "bg-line-soft/80")} />
                </div>
                <HScroller className="-mx-4 px-4 pb-1 sm:mx-0 sm:px-0">
                  {group.games.map((game, i) => (
                    <div key={game.id} className="rise shrink-0" style={{ animationDelay: `${i * 45}ms` }}>
                      <GameCard
                        game={game}
                        onOpen={onOpen}
                        mine={leagueView && isFollowed(game, followedKeys)}
                        pinned={leagueView && pinned.has(game.id)}
                      />
                    </div>
                  ))}
                </HScroller>
              </section>
            );
          })}
        </div>
      )}

      {liveCount > 0 && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-faint">
          {board.isFetching ? <Spinner className="!h-3 !w-3" /> : <span className="live-dot" />}
          {board.isFetching
            ? "Refreshing scores…"
            : `Auto-refreshing ${liveCount} live ${liveCount === 1 ? "game" : "games"}`}
        </div>
      )}
    </div>
  );
}

/** Shaped like the rows, so the eye lands where the games will. */
function BoardSkeleton() {
  return (
    <div className="mt-4 space-y-5" aria-hidden>
      {[0, 1].map((row) => (
        <div key={row}>
          <Skeleton className="mb-2.5 h-3 w-28" />
          <div className="no-scrollbar flex gap-3 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-[270px] shrink-0 rounded-md border border-line/60 bg-surface/60 p-3.5">
                <div className="mb-3 flex items-center justify-between">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <div className="space-y-3">
                  {[0, 1].map((j) => (
                    <div key={j} className="flex items-center gap-2.5">
                      <Skeleton className="h-[26px] w-[26px] rounded-[28%]" />
                      <Skeleton className="h-3.5 w-24 flex-1" />
                      <Skeleton className="h-5 w-6" />
                    </div>
                  ))}
                </div>
                <Skeleton className="mt-3 h-3 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
