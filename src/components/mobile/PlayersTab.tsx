"use client";

import { usePreferences } from "@/lib/store";
import { usePlayer } from "@/lib/queries";
import type { FollowedPlayer, GameLogEntry, Player, PlayerSeasonStat } from "@/lib/types";
import { Headshot } from "@/components/ui/Headshot";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { Bars, Eyebrow, Outcome } from "./primitives";
import { cn } from "@/lib/utils";

/* Players tab: one card per starred player — headshot, season stat grid with
   league ranks (a gold star for #1), a sparkline of the headline number, and
   the last few game logs. Tapping opens the full sheet. */

export function rankLabel(s: PlayerSeasonStat): { text: string; lead: boolean } {
  const lead = s.rank === 1;
  return { text: lead ? "★ 1st" : (s.rankDisplay ?? (s.rank ? `${s.rank}th` : "")), lead };
}

export function StatGrid({ stats, labels = false }: { stats: PlayerSeasonStat[]; labels?: boolean }) {
  return (
    <div className={cn("grid grid-cols-3", labels ? "gap-2" : "overflow-hidden rounded-[14px] border border-line-soft bg-bg-2/60")}>
      {stats.slice(0, 6).map((s, i) => {
        const r = rankLabel(s);
        return (
          <div key={s.abbr + i} className={cn("px-3 py-[11px]", labels ? "rounded-[13px] border border-line-soft bg-bg-2/60" : cn(i >= 3 && "border-t border-line-soft", i % 3 !== 0 && "border-l border-line-soft"))}>
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-semibold tracking-[0.08em] text-faint">{s.abbr}</span>
              <span className={cn("font-mono text-[9.5px] font-bold", r.lead ? "text-gold" : "text-faint")}>{r.text}</span>
            </div>
            <div className={cn("mt-[5px] font-mono text-[19px] font-semibold leading-none", r.lead ? "text-gold" : "text-ink")}>{s.value}</div>
            {labels && <div className="mt-[5px] text-[10.5px] text-faint">{s.label}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function GameLogRows({ entries }: { entries: GameLogEntry[] }) {
  return (
    <>
      {entries.map((g) => (
        <div key={g.id} className="flex items-center gap-[9px] border-t border-line-soft/70 py-[7px] text-[12.5px]">
          <span className="w-4 text-center text-[11.5px]"><Outcome result={g.result} /></span>
          <TeamLogo src={g.opponentLogo} name={g.opponentAbbr} abbr={g.opponentAbbr} size={20} className="rounded-[6px]" />
          <span className="w-[52px] text-faint">{g.atVs} {g.opponentAbbr}</span>
          <span className="ml-auto truncate font-mono text-[11.5px] text-muted">
            {Object.entries(g.stats).slice(0, 3).map(([k, v]) => `${v} ${k}`).join(" · ")}
          </span>
        </div>
      ))}
    </>
  );
}

function PlayerCardMobile({ follow, onOpen }: { follow: FollowedPlayer; onOpen: (p: FollowedPlayer, data: Player) => void }) {
  const { data, isPending } = usePlayer(follow.league, follow.id);
  if (isPending) return <Skeleton className="h-[300px] w-full rounded-[22px]" />;
  if (!data) return null;

  const spark = [...data.recent.entries].reverse().map((e) => e.primary);
  const empty = data.placeholder || data.stats.length === 0;

  return (
    <article className="rise overflow-hidden rounded-[22px] border border-line bg-surface shadow-[0_10px_26px_-22px_rgba(0,0,0,.5)]">
      <button type="button" onClick={() => onOpen(follow, data)} className="flex w-full items-center gap-[13px] p-4 text-left">
        <Headshot src={data.headshot} name={data.fullName} color={data.color} size={56} />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[17.5px] font-extrabold leading-[1.15] tracking-[-0.01em] text-ink">{data.fullName}</span>
          <span className="mt-[3px] block text-[12.5px] text-muted">{data.teamAbbr} · {data.position}{data.jersey ? ` · #${data.jersey}` : ""}</span>
        </span>
        <span className="flex-none rounded-full border border-line bg-bg-2/60 px-2.5 py-[5px] text-[11px] font-semibold text-faint">{data.seasonLabel.replace(/ (regular )?season stats$/i, "")}</span>
      </button>

      {empty ? (
        <p className="px-4 pb-4 text-[12.5px] text-faint">Season stats and recent games appear here once the feed has them.</p>
      ) : (
        <>
          <div className="mx-4"><StatGrid stats={data.stats} /></div>
          <div className="px-4 pb-4 pt-3.5">
            <div className="mb-2 flex items-center justify-between">
              <Eyebrow>Last {spark.length} · {data.recent.label}</Eyebrow>
              <Bars values={spark} color={data.color} height={22} className="w-[90px]" />
            </div>
            <GameLogRows entries={data.recent.entries.slice(0, 4)} />
          </div>
        </>
      )}
    </article>
  );
}

export function PlayersTab({ onOpen }: { onOpen: (p: FollowedPlayer, data: Player) => void }) {
  const players = usePreferences((s) => s.players);
  if (players.length === 0) return <EmptyState title="No players starred" body="Star the names you tune in for in Settings." />;
  return (
    <div className="flex flex-col gap-3.5 px-[18px] pb-6 pt-4">
      {players.map((p) => <PlayerCardMobile key={`${p.league}:${p.id}`} follow={p} onOpen={onOpen} />)}
    </div>
  );
}
