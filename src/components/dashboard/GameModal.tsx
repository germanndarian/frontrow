"use client";

import type { Game, GameSide } from "@/lib/types";
import { LEAGUES } from "@/lib/leagues";
import { detailRows, hasLineScore, isLeading, statusLine } from "@/lib/game-detail";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { SheetFrame } from "@/components/ui/SheetFrame";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { Countdown } from "./Countdown";
import { FieldGraphic } from "./FieldGraphic";
import { LineScore } from "./LineScore";

/* One game in full: the score, where it's up to, and everything else the feed
   knows. Before the start there's no score to show, so it counts down instead.
   The same sheet, in the same order, as the iPhone app's.

   `game` is what's drawn and `open` whether it's showing — kept apart so the
   game stays on screen while the sheet animates away. */

export function GameModal({
  open,
  game,
  onClose,
  action,
}: {
  open: boolean;
  game: Game | null;
  onClose: () => void;
  /** A control for the header, beside the close button. */
  action?: React.ReactNode;
}) {
  return (
    <Modal open={open && !!game} onClose={onClose} labelledBy="game-sheet-title">
      {game && (
        <SheetFrame
          titleId="game-sheet-title"
          title={LEAGUES[game.league].name}
          subtitle={statusLine(game)}
          action={action}
          onClose={onClose}
          closeLabel="Close game"
          bodyClassName="space-y-3 bg-bg/50 p-4"
        >
          <ScoreHeader game={game} />
          {game.state === "pre" ? (
            <Countdown startsAt={game.date} />
          ) : (
            <>
              {/* Football's own graphic: where the ball is and what it'll take
                  to keep it. None for the other sports. */}
              {game.field && <FieldGraphic game={game} field={game.field} />}
              {hasLineScore(game) && <LineScore game={game} />}
            </>
          )}
          <Details game={game} />
        </SheetFrame>
      )}
    </Modal>
  );
}

function ScoreHeader({ game }: { game: Game }) {
  return (
    <div className="rounded-[16px] border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        {game.state === "in" ? (
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-live">
            <span className="live-dot" />
            {game.shortDetail || "Live"}
          </span>
        ) : (
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
            {game.state === "post" ? "Final" : "Scheduled"}
          </span>
        )}
        {game.week != null && (
          <span className="font-mono text-[10px] font-bold tracking-[0.06em] text-muted">WEEK {game.week}</span>
        )}
      </div>
      <div className="space-y-3">
        <Side game={game} side={game.away} />
        <Side game={game} side={game.home} />
      </div>
    </div>
  );
}

function Side({ game, side }: { game: Game; side: GameSide }) {
  const leads = isLeading(game, side);
  return (
    <div className="flex items-center gap-3">
      <TeamLogo src={side.logo} name={side.displayName} abbr={side.abbreviation} color={side.color} size={40} />
      <div className="min-w-0 flex-1">
        <div className={cn("truncate font-display text-[17px] font-bold", leads ? "text-ink" : "text-muted")}>
          {side.displayName}
        </div>
        {side.record && <div className="text-[12px] text-faint">{side.record}</div>}
      </div>
      <div className={cn("tnum font-mono text-[30px] font-bold leading-none", leads ? "text-ink" : "text-muted")}>
        {game.state === "pre" ? "–" : (side.score ?? 0)}
      </div>
    </div>
  );
}

function Details({ game }: { game: Game }) {
  const rows = detailRows(game);
  if (rows.length === 0) return null;
  return (
    <dl className="overflow-hidden rounded-[16px] border border-line bg-surface">
      {rows.map(([label, value], i) => (
        <div key={label} className={cn("flex items-baseline gap-3 px-4 py-2.5", i > 0 && "border-t border-line-soft")}>
          <dt className="w-24 shrink-0 text-[12.5px] text-faint">{label}</dt>
          <dd className="min-w-0 flex-1 text-[13.5px] font-medium text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
