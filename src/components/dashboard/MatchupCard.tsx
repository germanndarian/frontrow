"use client";

import type { CSSProperties } from "react";
import type { PlayoffSide } from "@/lib/types";
import { type BracketCard, CARD_W } from "@/lib/bracket-layout";
import { cn } from "@/lib/utils";
import { TeamLogo } from "@/components/ui/TeamLogo";

function Row({ side }: { side: PlayoffSide }) {
  return (
    <div className="flex items-center gap-2">
      <TeamLogo
        src={side.logo}
        name={side.displayName}
        abbr={side.abbreviation}
        color={side.color}
        size={18}
      />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[12.5px]",
          side.winner ? "font-extrabold text-ink" : "font-semibold text-muted",
        )}
      >
        {side.seed ? <span className="mr-1 text-[10px] text-faint">{side.seed}</span> : null}
        {side.abbreviation}
      </span>
      <span
        className={cn(
          "tnum text-[12.5px]",
          side.winner ? "font-extrabold text-ink" : "font-semibold text-muted",
        )}
      >
        {side.score ?? "—"}
      </span>
    </div>
  );
}

export function MatchupCard({
  card,
  style,
}: {
  card: BracketCard;
  style: CSSProperties;
}) {
  const m = card.matchup;
  return (
    <div
      style={{ ...style, width: CARD_W }}
      className={cn(
        "absolute rounded-[10px] border px-2.5 py-2 transition-colors",
        card.onPath
          ? "border-primary/60 bg-primary/[0.07] shadow-[0_0_0_3px_oklch(0.645_0.168_257/0.14)]"
          : "border-line/70 bg-surface-2/50",
      )}
    >
      <Row side={m.home} />
      <div className="mt-1" />
      <Row side={m.away} />
      {m.summary && (
        <div
          className={cn(
            "mt-1.5 truncate text-[10px]",
            m.state === "in" ? "text-primary-bright" : "text-faint",
          )}
          title={m.summary}
        >
          {m.state === "in" && <span className="live-dot mr-1 !h-1.5 !w-1.5 align-middle" />}
          {m.summary}
        </div>
      )}
    </div>
  );
}
