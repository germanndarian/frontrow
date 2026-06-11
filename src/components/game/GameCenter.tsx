"use client";

import Link from "next/link";
import type { GameSide, GameSummary, LeagueId } from "@/lib/types";
import { LEAGUES } from "@/lib/leagues";
import { useGameSummary } from "@/lib/queries";
import { cn, clockTime, relativeTime } from "@/lib/utils";
import { Wordmark } from "@/components/brand/Wordmark";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { StatusTag } from "@/components/ui/Badge";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { WinProbabilityChart } from "./WinProbabilityChart";
import { ScoringTimeline } from "./ScoringTimeline";
import { PlayByPlayFeed } from "./PlayByPlayFeed";
import { DrivesPanel } from "./DrivesPanel";
import { GameLeaders } from "./GameLeaders";

function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/72 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/dashboard" className="rounded-md transition-opacity hover:opacity-85">
          <Wordmark />
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-full border border-line/60 bg-surface/50 px-3 py-1.5 text-[13px] font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
      </div>
    </header>
  );
}

function HeroSide({ side, possession }: { side: GameSide; possession: string | null }) {
  const hasBall = possession != null && side.abbreviation === possession;
  return (
    <div className="flex flex-1 flex-col items-center gap-2 text-center">
      <TeamLogo src={side.logo} name={side.displayName} abbr={side.abbreviation} color={side.color} size={64} />
      <div>
        <div className="flex items-center justify-center gap-1.5">
          <span className="font-display text-[16px] font-bold tracking-tight text-ink">
            {side.abbreviation}
          </span>
          {hasBall && <span title="Has possession" aria-label="Has possession">🏈</span>}
        </div>
        {side.record && <div className="text-[12px] text-faint">{side.record}</div>}
      </div>
    </div>
  );
}

function Hero({ game }: { game: GameSummary }) {
  const league = LEAGUES[game.league];
  const showScore = game.state !== "pre";
  const homeLeads = (game.home.score ?? 0) >= (game.away.score ?? 0);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-line-soft/60 px-4 py-2.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-faint">
          {league.name}
        </span>
        <StatusTag
          state={game.state}
          label={game.state === "pre" ? clockTime(game.date) : game.shortDetail}
        />
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-6 sm:px-8">
        <HeroSide side={game.away} possession={game.possession} />

        {showScore ? (
          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            <span
              className={cn(
                "tnum font-mono text-[40px] font-semibold tabular-nums sm:text-[52px]",
                game.state === "in" && !homeLeads ? "text-primary-bright" : "text-ink",
              )}
            >
              {game.away.score ?? 0}
            </span>
            <span className="text-[20px] text-faint">–</span>
            <span
              className={cn(
                "tnum font-mono text-[40px] font-semibold tabular-nums sm:text-[52px]",
                game.state === "in" && homeLeads ? "text-primary-bright" : "text-ink",
              )}
            >
              {game.home.score ?? 0}
            </span>
          </div>
        ) : (
          <div className="shrink-0 text-center">
            <div className="font-display text-[15px] font-bold text-ink">{relativeTime(game.date)}</div>
            <div className="text-[12px] text-faint">{clockTime(game.date)}</div>
          </div>
        )}

        <HeroSide side={game.home} possession={game.possession} />
      </div>

      {(game.statusDetail || game.venue || game.broadcast) && (
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-line-soft/60 px-4 py-2.5 text-[12px] text-faint">
          {game.statusDetail && <span className="font-semibold text-muted">{game.statusDetail}</span>}
          {game.statusDetail && (game.venue || game.broadcast) && <span>·</span>}
          {[game.broadcast, game.venue].filter(Boolean).join(" · ")}
        </div>
      )}
    </Card>
  );
}

function GameCenterSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-7 sm:px-6">
      <Skeleton className="mb-6 h-[200px] w-full rounded-lg" />
      <Skeleton className="mb-6 h-[260px] w-full rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[420px] w-full rounded-lg" />
        <Skeleton className="h-[420px] w-full rounded-lg" />
      </div>
    </main>
  );
}

export function GameCenter({ league, id }: { league: LeagueId; id: string }) {
  const { data, isPending, isError, refetch } = useGameSummary(league, id);

  if (isPending) {
    return (
      <>
        <TopBar />
        <GameCenterSkeleton />
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <TopBar />
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
          <Card>
            <ErrorState
              onRetry={() => refetch()}
              message="We couldn't load this game's details."
            />
          </Card>
        </main>
      </>
    );
  }

  const live = data.state === "in";
  const isFootball = LEAGUES[data.league].sport === "football";

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-6xl space-y-6 px-4 pb-24 pt-7 sm:px-6">
        <Hero game={data} />

        {data.hasWinProb && (
          <WinProbabilityChart home={data.home} away={data.away} points={data.winProbability} />
        )}

        {data.leaders.length > 0 && (
          <GameLeaders leaders={data.leaders} home={data.home} away={data.away} />
        )}

        {/* Football gets a drives column; other sports get scoring + play-by-play. */}
        {isFootball && data.drives.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-1">
              <DrivesPanel
                drives={data.drives}
                possession={data.possession}
                home={data.home}
                away={data.away}
              />
              <ScoringTimeline plays={data.scoringPlays} home={data.home} away={data.away} />
            </div>
            <div className="lg:col-span-2">
              <PlayByPlayFeed plays={data.plays} home={data.home} away={data.away} live={live} />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <ScoringTimeline plays={data.scoringPlays} home={data.home} away={data.away} />
            <PlayByPlayFeed plays={data.plays} home={data.home} away={data.away} live={live} />
          </div>
        )}

        <footer className="mt-10 border-t border-line-soft/60 pt-6 text-[12px] text-faint">
          Frontrow · live game detail via ESPN&apos;s public endpoints. Win probability, plays,
          and drives update {live ? "automatically while the game is live" : "after each game"}.
        </footer>
      </main>
    </>
  );
}
