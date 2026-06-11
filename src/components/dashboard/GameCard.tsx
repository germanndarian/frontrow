"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { Game, GameSide } from "@/lib/types";
import { LEAGUES } from "@/lib/leagues";
import { cn, clockTime, relativeTime } from "@/lib/utils";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { StatusTag } from "@/components/ui/Badge";

function Row({
  side,
  game,
  leading,
  followed,
}: {
  side: GameSide;
  game: Game;
  leading: boolean;
  followed: boolean;
}) {
  const showScore = game.state !== "pre";
  const dim = game.state === "post" && side.score != null && !leading;

  return (
    <div className="flex items-center gap-2.5">
      <TeamLogo
        src={side.logo}
        name={side.displayName}
        abbr={side.abbreviation}
        color={side.color}
        size={26}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {side.rank && (
            <span className="tnum text-[11px] font-bold text-faint">{side.rank}</span>
          )}
          <span
            className={cn(
              "truncate font-display text-[14px] font-bold tracking-tight",
              dim ? "text-faint" : "text-ink",
            )}
          >
            {side.shortName}
          </span>
          {followed && (
            <svg className="h-3 w-3 shrink-0 text-gold" viewBox="0 0 24 24" fill="currentColor" aria-label="Following">
              <path d="m12 2 2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" />
            </svg>
          )}
        </div>
        {side.record && (
          <div className="truncate text-[11px] text-faint">{side.record}</div>
        )}
      </div>
      {showScore && (
        <div
          className={cn(
            "tnum font-mono text-[22px] font-semibold tabular-nums",
            game.state === "in" ? "text-ink" : dim ? "text-faint" : "text-ink",
            leading && game.state === "in" && "text-primary-bright",
          )}
        >
          {side.score}
        </div>
      )}
    </div>
  );
}

export function GameCard({
  game,
  followedKeys,
}: {
  game: Game;
  followedKeys: Set<string>;
}) {
  const league = LEAGUES[game.league];
  const homeFollowed = followedKeys.has(`${game.league}:${game.home.teamId}`);
  const awayFollowed = followedKeys.has(`${game.league}:${game.away.teamId}`);
  const isFollowed = homeFollowed || awayFollowed;

  const homeLeads =
    game.home.score != null && game.away.score != null
      ? game.home.score >= game.away.score
      : false;
  const awayLeads =
    game.home.score != null && game.away.score != null
      ? game.away.score >= game.home.score
      : false;

  return (
    <Link
      href={`/game/${game.league}/${game.id}`}
      aria-label={`${game.away.displayName} at ${game.home.displayName} — open game center`}
      className={cn(
        "group flex w-[270px] shrink-0 snap-start flex-col rounded-md border bg-surface/70 p-3.5",
        "transition-[transform,border-color,background-color] duration-200",
        "hover:-translate-y-0.5 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        isFollowed ? "border-primary/35 hover:border-primary/60" : "border-line/60 hover:border-line",
      )}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-faint">
          {league.name}
        </span>
        <StatusTag
          state={game.state}
          label={game.state === "pre" ? clockTime(game.date) : game.shortDetail}
        />
      </div>

      <div className="space-y-2">
        <Row side={game.away} game={game} leading={awayLeads} followed={awayFollowed} />
        <Row side={game.home} game={game} leading={homeLeads} followed={homeFollowed} />
      </div>

      <div className="mt-3 border-t border-line-soft/70 pt-2.5">
        {game.state === "in" && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-live">{game.period}</span>
              {game.situation && <span className="text-muted">{game.situation}</span>}
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={game.lastPlay}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="truncate text-[12px] leading-snug text-muted"
              >
                {game.lastPlay}
              </motion.p>
            </AnimatePresence>
          </div>
        )}
        {game.state === "pre" && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-semibold text-ink">{relativeTime(game.date)}</span>
              <span className="truncate pl-2 text-faint">
                {[game.broadcast, game.venue].filter(Boolean).join(" · ")}
              </span>
            </div>
            {game.odds && (
              <div className="flex items-center gap-2 text-[12px]">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-faint">
                  Odds
                </span>
                <span className="font-semibold text-ink">{game.odds.details}</span>
                {game.odds.overUnder != null && (
                  <span className="text-muted">O/U {game.odds.overUnder}</span>
                )}
              </div>
            )}
          </div>
        )}
        {game.state === "post" && (
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-semibold text-faint">Final</span>
            {game.venue && <span className="truncate pl-2 text-faint">{game.venue}</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
