"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Game, GameState, LeagueId } from "@/lib/types";
import { LEAGUES } from "@/lib/leagues";
import { useScoreboard } from "@/lib/queries";
import { GameCard } from "./GameCard";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState, Spinner } from "@/components/ui/States";

const STATE_ORDER: Record<GameState, number> = { in: 0, pre: 1, post: 2 };

function GameCardSkeleton() {
  return (
    <div className="w-[270px] shrink-0 rounded-md border border-line/60 bg-surface/60 p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Skeleton className="h-[26px] w-[26px] rounded-[28%]" />
            <Skeleton className="h-3.5 w-24 flex-1" />
            <Skeleton className="h-5 w-6" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-3 h-3 w-full" />
    </div>
  );
}

export function ScoreboardStrip({
  leagues,
  only,
  followedKeys,
}: {
  leagues: LeagueId[];
  only?: LeagueId;
  followedKeys: Set<string>;
}) {
  const { data, isPending, isError, refetch, isFetching } = useScoreboard(leagues);

  const sorted = useMemo<Game[]>(() => {
    if (!data) return [];
    return [...data]
      .filter((g) => (only ? g.league === only : true))
      .sort((a, b) => {
        const s = STATE_ORDER[a.state] - STATE_ORDER[b.state];
        if (s !== 0) return s;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
  }, [data, only]);

  const liveCount = sorted.filter((g) => g.state === "in").length;

  // Fade an edge only when there's actually hidden content past it, so the
  // resting first/last card keeps its border instead of bleeding into the mask.
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState({ left: false, right: false });
  const updateFade = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setFade({
      left: scrollLeft > 2,
      right: scrollLeft < scrollWidth - clientWidth - 2,
    });
  }, []);
  useEffect(() => {
    updateFade();
    const el = scrollerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateFade);
    ro.observe(el);
    window.addEventListener("resize", updateFade);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateFade);
    };
  }, [updateFade, sorted.length]);

  const maskImage = `linear-gradient(to right, ${[
    fade.left ? "transparent 0" : "#000 0",
    fade.left ? "#000 1.25rem" : null,
    fade.right ? "#000 calc(100% - 1.25rem)" : null,
    fade.right ? "transparent 100%" : "#000 100%",
  ]
    .filter(Boolean)
    .join(", ")})`;

  if (isPending) {
    return (
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {[0, 1, 2, 3].map((i) => (
          <GameCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <ErrorState onRetry={() => refetch()} />
      </Card>
    );
  }

  if (sorted.length === 0) {
    const hints = (only ? [only] : leagues).map((l) => LEAGUES[l].name).join(" · ");
    return (
      <Card>
        <EmptyState
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M3 10h18M8 4v16" />
            </svg>
          }
          title="No games on the slate"
          body={`Nothing scheduled for ${hints} right now. Live scores will appear here the moment the next one starts.`}
        />
      </Card>
    );
  }

  return (
    <div>
      <div
        ref={scrollerRef}
        onScroll={updateFade}
        className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
        style={{ WebkitMaskImage: maskImage, maskImage }}
      >
        {sorted.map((game, i) => (
          <div key={game.id} className="rise shrink-0" style={{ animationDelay: `${i * 45}ms` }}>
            <GameCard game={game} followedKeys={followedKeys} />
          </div>
        ))}
      </div>
      {liveCount > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-faint">
          {isFetching ? <Spinner className="!h-3 !w-3" /> : <span className="live-dot" />}
          {isFetching ? "Refreshing scores…" : `Auto-refreshing ${liveCount} live ${liveCount === 1 ? "game" : "games"}`}
        </div>
      )}
    </div>
  );
}
