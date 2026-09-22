"use client";

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
}: {
  side: GameSide;
  game: Game;
  leading: boolean;
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

/** What a screen reader hears for the card: who, the score and the clock, or
    who and when. */
function cardLabel(game: Game): string {
  if (game.state === "pre") {
    return `${game.away.shortName} at ${game.home.shortName}, ${relativeTime(game.date)}`;
  }
  const status = game.state === "in" ? game.shortDetail || "live" : game.shortDetail || "final";
  return `${game.away.shortName} ${game.away.score ?? 0}, ${game.home.shortName} ${game.home.score ?? 0}, ${status}`;
}

/** One game. The whole card is a button that opens the game's sheet.

    `mine` marks one of your teams' games — a star, a tint, an edge down the
    left and a stronger border — and `pinned` a game held at the front of its
    row. The board only sets them in a league's view, where they mean something. */
export function GameCard({
  game,
  onOpen,
  mine = false,
  pinned = false,
  className,
}: {
  game: Game;
  onOpen?: (game: Game) => void;
  mine?: boolean;
  pinned?: boolean;
  className?: string;
}) {
  const league = LEAGUES[game.league];

  const homeLeads =
    game.home.score != null && game.away.score != null
      ? game.home.score >= game.away.score
      : false;
  const awayLeads =
    game.home.score != null && game.away.score != null
      ? game.away.score >= game.home.score
      : false;

  return (
    <button
      type="button"
      onClick={() => onOpen?.(game)}
      aria-label={cardLabel(game)}
      className={cn(
        "relative flex w-[270px] shrink-0 snap-start flex-col overflow-hidden rounded-md p-3.5 text-left",
        "transition-[border-color,background-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.99]",
        mine
          ? "border-2 border-primary bg-primary/[0.07] pl-[18px] shadow-[0_12px_28px_-18px_var(--color-primary)] before:absolute before:inset-y-0 before:left-0 before:w-[5px] before:bg-primary"
          : "border border-line/60 bg-surface/70 hover:border-line hover:bg-surface",
        className,
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-faint">
          {mine && (
            <svg className="h-3 w-3 shrink-0 text-primary" viewBox="0 0 24 24" fill="currentColor" aria-label="Your team">
              <path d="m12 2 2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" />
            </svg>
          )}
          {pinned && (
            <svg className="h-3 w-3 shrink-0 text-gold" viewBox="0 0 24 24" fill="currentColor" aria-label="Pinned">
              <path d="M16 3a1 1 0 0 1 .7 1.7L15 6.4v4.2l2.7 2.7a1 1 0 0 1-.7 1.7H13v5a1 1 0 0 1-2 0v-5H7a1 1 0 0 1-.7-1.7L9 10.6V6.4L7.3 4.7A1 1 0 0 1 8 3h8Z" />
            </svg>
          )}
          {league.name}
          {game.week != null && (
            <span className="rounded-full bg-bg-2 px-1.5 py-px font-mono text-[9.5px] tracking-[0.06em] text-muted">
              WEEK {game.week}
            </span>
          )}
        </span>
        <StatusTag
          state={game.state}
          label={game.state === "pre" ? clockTime(game.date) : game.shortDetail}
        />
      </div>

      <div className="space-y-2">
        <Row side={game.away} game={game} leading={awayLeads} />
        <Row side={game.home} game={game} leading={homeLeads} />
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
    </button>
  );
}
