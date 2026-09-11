"use client";

import { useState } from "react";
import { usePreferences } from "@/lib/store";
import { useStandings } from "@/lib/queries";
import { LEAGUES, LEAGUE_ORDER } from "@/lib/leagues";
import type { LeagueId } from "@/lib/types";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Chip, ChipRow, Eyebrow, Panel } from "./primitives";
import { cn } from "@/lib/utils";

/* Table tab: one league at a time, the followed team's division or
   conference with that team's row highlighted. Columns per league come from
   leagues.ts so the NHL shows GP/W/L/PTS and the NFL shows W/L/PCT/STRK. */

const CLINCH: Record<string, string> = { x: "clinched playoff berth", y: "clinched division", z: "clinched home-field", e: "eliminated" };

function Standings({ league }: { league: LeagueId }) {
  const teams = usePreferences((s) => s.teams);
  const mine = teams.find((t) => t.league === league)?.teamId;
  const { data, isPending, isError, refetch } = useStandings(league, mine);
  const meta = LEAGUES[league];
  const cols = meta.standingsColumns;

  if (isPending) return <Skeleton className="h-[360px] w-full rounded-[20px]" />;
  if (isError) return <ErrorState onRetry={() => refetch()} message={`Couldn't load ${meta.name} standings.`} />;
  if (!data || data.rows.length === 0) return <EmptyState title="No standings yet" body={meta.inSeason ? "Check back once games are underway." : meta.seasonHint} />;

  const markers = [...new Set(data.rows.map((r) => r.clinched).filter(Boolean))] as string[];
  const note = markers.length ? markers.map((m) => `${m} — ${CLINCH[m] ?? m}`).join(". ") + "." : "Your team highlighted. Updated as games finish.";

  return (
    <Panel className="overflow-hidden">
      <div className="px-4 pb-3 pt-4">
        <Eyebrow>{meta.name} · {meta.groupNoun}</Eyebrow>
        <h3 className="m-0 mt-0.5 font-display text-[17px] font-extrabold tracking-[-0.01em] text-ink">{data.name}</h3>
      </div>
      <div className="flex items-center gap-2 border-b border-line-soft px-4 pb-2 text-[10px] font-semibold tracking-[0.08em] text-faint">
        <span className="w-4">#</span>
        <span className="flex-1">TEAM</span>
        {cols.map((c) => <span key={c.key} className="w-[38px] text-right">{c.label}</span>)}
      </div>
      {data.rows.map((r) => (
        <div key={r.teamId} className={cn("flex items-center gap-2 border-b border-line-soft/70 px-4 py-[11px]", r.followed && "bg-primary/7")}>
          <span className={cn("w-4 font-mono text-[12px] font-bold", r.followed ? "text-primary" : "text-faint")}>{r.position}</span>
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <TeamLogo src={r.logo} name={r.displayName} abbr={r.abbreviation} size={24} className="rounded-[7px]" />
            <span className={cn("truncate text-[13.5px] font-semibold", r.followed ? "text-ink" : "text-muted")}>
              {r.displayName}{r.clinched ? <sup className="ml-0.5 text-[9px] text-faint">{r.clinched}</sup> : null}
            </span>
          </span>
          {cols.map((c) => (
            <span key={c.key} className={cn("w-[38px] text-right font-mono", c.emphasis ? "text-[13px] font-bold text-ink" : "text-[12.5px] font-medium text-muted")}>
              {r.stats[c.key] ?? "–"}
            </span>
          ))}
        </div>
      ))}
      <p className="m-0 px-4 py-[13px] text-[11.5px] leading-[1.5] text-faint">{note}</p>
    </Panel>
  );
}

export function TableTab() {
  const leagues = usePreferences((s) => s.leagues);
  const ordered = LEAGUE_ORDER.filter((l) => leagues.includes(l));
  const [league, setLeague] = useState<LeagueId | null>(null);
  const active = league && ordered.includes(league) ? league : ordered[0];

  if (!active) return <EmptyState title="No leagues followed" body="Pick your leagues in Settings to see standings." />;

  return (
    <div className="pb-6">
      <ChipRow>
        {ordered.map((l) => <Chip key={l} label={LEAGUES[l].name} on={l === active} onClick={() => setLeague(l)} />)}
      </ChipRow>
      <div className="px-[18px] pt-4">
        <Standings league={active} />
      </div>
    </div>
  );
}
