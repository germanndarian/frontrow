"use client";

import { useState } from "react";
import { usePreferences } from "@/lib/store";
import { useTeamCard } from "@/lib/queries";
import { LEAGUES } from "@/lib/leagues";
import type { FollowedTeam, TeamCard } from "@/lib/types";
import { currentStreak, mean, parseRecord, scoreNoun, winPct } from "@/lib/team-stats";
import { whenLabel } from "@/lib/mobile-scores";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { Bars, Eyebrow, Panel, Rule, StatTile } from "./primitives";
import { cn } from "@/lib/utils";

/* Teams tab: one card per followed team (form, next up, scoring trend, and
   schedule / bracket actions). Tapping a card features it in the Season
   Stats panel underneath. Data comes from useTeamCard; React Query dedupes
   the second read the spotlight makes. */

export type TeamAction = { kind: "schedule" | "bracket"; team: FollowedTeam };

function FormChips({ form }: { form: TeamCard["form"] }) {
  const five = form.slice(0, 5);
  if (five.length === 0) return <p className="text-[12.5px] text-faint">No games logged yet.</p>;
  return (
    <div className="flex gap-1.5">
      {five.map((f, i) => (
        <div key={i} className="flex-1 text-center">
          <div className={cn("grid h-[30px] place-items-center rounded-[9px] font-mono text-[12px] font-bold", f.result === "W" ? "bg-win/14 text-win" : f.result === "L" ? "bg-loss/14 text-loss" : "bg-bg-2 text-muted")}>
            {f.result}
          </div>
          <span className="mt-1 block text-[10px] font-medium text-faint">{f.atVs === "@" ? "@" : ""}{f.opponentAbbr}</span>
        </div>
      ))}
    </div>
  );
}

function TeamCardMobile({ follow, selected, onSelect, onAction }: { follow: FollowedTeam; selected: boolean; onSelect: () => void; onAction: (a: TeamAction) => void }) {
  const { data, isPending } = useTeamCard(follow.league, follow.teamId);
  const meta = LEAGUES[follow.league];
  const inSeason = meta.inSeason;

  if (isPending) return <Skeleton className="h-[280px] w-full rounded-[22px]" />;

  const team = data?.team;
  const form = data?.form ?? [];
  const scoring = data?.scoring ?? [];
  const next = data?.next ?? null;
  const record = team?.record ?? follow.abbreviation;
  const standing = team?.standingSummary || (inSeason ? "" : meta.seasonHint);

  return (
    <article
      className={cn("rise overflow-hidden rounded-[22px] border bg-surface", selected ? "border-primary/60 shadow-[0_0_0_1px_var(--color-primary),0_16px_40px_-26px_oklch(0.5_0.16_257/0.7)]" : "border-line shadow-[0_10px_26px_-22px_rgba(0,0,0,.5)]")}
    >
      <button type="button" onClick={onSelect} className="relative flex w-full items-center gap-3 px-4 pb-[15px] pt-[17px] text-left">
        <div className="absolute inset-0" style={{ background: `linear-gradient(105deg, color-mix(in oklab, ${follow.color} 22%, transparent), transparent 62%)` }} />
        <TeamLogo src={follow.logo} name={follow.displayName} abbr={follow.abbreviation} color={follow.color} size={46} className="relative rounded-[14px]" />
        <span className="relative min-w-0 flex-1">
          <span className="block font-display text-[17.5px] font-extrabold leading-[1.15] tracking-[-0.01em] text-ink">{follow.displayName}</span>
          <span className="mt-0.5 block text-[12.5px] font-medium text-muted">{standing}</span>
        </span>
        <span className="relative flex-none text-right">
          <span className="block font-mono text-[16px] font-semibold text-ink">{record}</span>
          <span className="block text-[10.5px] tracking-[0.1em] text-faint">{meta.name}</span>
        </span>
      </button>

      <div className="px-4 pb-4 pt-1">
        <Eyebrow className="mb-2">{inSeason ? "Recent form" : `Last ${Math.min(5, form.length) || 5}`}</Eyebrow>
        <FormChips form={form} />
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-[14px] border border-line-soft bg-bg-2/60 p-3">
            <Eyebrow className="mb-2 text-[10px]">{inSeason ? "Next up" : "Season opener"}</Eyebrow>
            {next ? (
              <div className="flex items-center gap-2">
                <TeamLogo src={next.opponentLogo} name={next.opponentName} abbr={next.opponentAbbr} size={24} className="rounded-[8px]" />
                <span className="min-w-0">
                  <span className="block font-display text-[13px] font-bold text-ink">{next.atVs} {next.opponentAbbr}</span>
                  <span className="block truncate text-[11px] text-faint">{whenLabel(next.date)}</span>
                </span>
              </div>
            ) : (
              <span className="text-[12.5px] font-semibold text-muted">{inSeason ? "Nothing scheduled" : meta.seasonHint}</span>
            )}
          </div>
          <div className="rounded-[14px] border border-line-soft bg-bg-2/60 p-3">
            <Eyebrow className="mb-2 text-[10px]">{scoring.length ? `${scoreNoun(follow.league)} · last ${scoring.length}` : "Standing"}</Eyebrow>
            {scoring.length ? <Bars values={scoring} color={follow.color} /> : <span className="text-[12.5px] font-semibold text-muted">{standing || "—"}</span>}
          </div>
        </div>
      </div>

      <div className="flex border-t border-line-soft">
        {data?.inPlayoffs && (
          <button type="button" onClick={() => onAction({ kind: "bracket", team: follow })} className="flex-1 border-r border-line-soft py-3.5 text-[13px] font-semibold text-primary">
            Playoff bracket
          </button>
        )}
        <button type="button" onClick={() => onAction({ kind: "schedule", team: follow })} className="flex-1 py-3.5 text-[13px] font-semibold text-muted">
          {inSeason ? "Full schedule" : "Schedule"}
        </button>
      </div>
    </article>
  );
}

function Spotlight({ follow }: { follow: FollowedTeam }) {
  const { data, isPending } = useTeamCard(follow.league, follow.teamId);
  const meta = LEAGUES[follow.league];
  if (isPending) return <Skeleton className="mt-3 h-[320px] w-full rounded-[20px]" />;

  const team = data?.team;
  const form = data?.form ?? [];
  const scoring = data?.scoring ?? [];
  const conceded = data?.conceded;
  const rec = parseRecord(team?.record ?? "");
  const pct = rec ? winPct(rec.w, rec.l, rec.t) : "—";
  const streak = currentStreak(form);
  const noun = scoreNoun(follow.league);
  const hasAllowed = !!conceded && conceded.length === scoring.length && scoring.length > 0;
  const avgFor = mean(scoring);
  const avgAgainst = hasAllowed ? mean(conceded!) : 0;
  const diff = avgFor - avgAgainst;

  const tiles: { value: string; label: string; ink?: string }[] = scoring.length
    ? [
        { value: avgFor.toFixed(1), label: `${noun}/G` },
        ...(hasAllowed ? [{ value: avgAgainst.toFixed(1), label: "Allowed/G" }, { value: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}`, label: "Diff", ink: diff >= 0 ? "var(--color-win)" : "var(--color-loss)" }] : []),
        { value: String(Math.max(...scoring)), label: "High" },
        ...(hasAllowed ? [] : [{ value: String(Math.min(...scoring)), label: "Low" }]),
        { value: String(scoring.reduce((a, b) => a + b, 0)), label: "Total" },
      ]
    : [
        { value: team?.record ?? "—", label: "Record" },
        { value: pct, label: "Win %" },
        { value: streak?.label ?? "—", label: "Streak" },
      ];

  return (
    <Panel className="mt-3 overflow-hidden">
      <div className="flex items-baseline justify-between px-4 pt-4">
        <div>
          <Eyebrow>Season</Eyebrow>
          <h3 className="m-0 mt-px font-display text-[15px] font-bold text-ink">Record &amp; form</h3>
        </div>
        <span className="text-[12px] font-medium text-muted">{team?.standingSummary || meta.seasonHint}</span>
      </div>
      <div className="flex items-end gap-5 px-4 pb-4 pt-3.5">
        <div>
          <div className="font-mono text-[32px] font-black leading-none tracking-[-0.02em] text-ink">{team?.record ?? "—"}</div>
          <div className="mt-[5px] text-[10.5px] tracking-[0.1em] text-faint">RECORD</div>
        </div>
        <div>
          <div className="font-mono text-[21px] font-semibold leading-none text-ink">{pct}</div>
          <div className="mt-[7px] text-[10.5px] tracking-[0.1em] text-faint">WIN %</div>
        </div>
        {streak && (
          <span className={cn("ml-auto rounded-full px-3 py-1.5 font-mono text-[13px] font-bold", streak.result === "W" ? "bg-win/15 text-win" : streak.result === "L" ? "bg-loss/15 text-loss" : "bg-bg-2 text-muted")}>
            {streak.label}
          </span>
        )}
      </div>
      <div className="border-t border-line-soft px-4 pb-4 pt-3.5">
        <Eyebrow>{scoring.length ? "Per game" : "Season"}</Eyebrow>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {tiles.map((t) => <StatTile key={t.label} value={t.value} label={t.label} ink={t.ink} />)}
        </div>
      </div>
      <div className="border-t border-line-soft px-4 pb-[18px] pt-3.5">
        <div className="flex items-baseline justify-between">
          <Eyebrow>{scoring.length ? `${noun} scored · last ${scoring.length}` : "Off-season"}</Eyebrow>
          <span className="text-[11.5px] text-faint">{scoring.length ? `high ${Math.max(...scoring)} · low ${Math.min(...scoring)}` : meta.seasonHint}</span>
        </div>
        <Bars values={scoring.length ? scoring : Array(10).fill(1)} color={scoring.length ? follow.color : "var(--color-line-soft)"} height={74} gap={5} radius={4} className="mt-3" />
      </div>
    </Panel>
  );
}

export function TeamsTab({ onAction }: { onAction: (a: TeamAction) => void }) {
  const teams = usePreferences((s) => s.teams);
  const [selected, setSelected] = useState<string | null>(null);
  // Fall back to the first team when nothing (or an unfollowed team) is picked —
  // derived, not synced, so there's no setState in an effect.
  const spot = teams.find((t) => `${t.league}:${t.teamId}` === selected) ?? teams[0];
  const selectedKey = spot ? `${spot.league}:${spot.teamId}` : null;

  if (teams.length === 0) {
    return <EmptyState title="No teams yet" body="Add the teams you follow in Settings and they'll show up here." />;
  }

  return (
    <div className="px-[18px] pb-6 pt-4">
      <p className="mb-3.5 text-[12.5px] text-faint">Tap a team to feature it in Season Stats below.</p>
      <div className="flex flex-col gap-3.5">
        {teams.map((t) => {
          const key = `${t.league}:${t.teamId}`;
          return <TeamCardMobile key={key} follow={t} selected={key === selectedKey} onSelect={() => setSelected(key)} onAction={onAction} />;
        })}
      </div>
      {spot && (
        <div className="mt-[30px]">
          <Rule title="SEASON STATS" count={spot.abbreviation} accent={spot.color} />
          <div className="-mt-3">
            <Spotlight follow={spot} />
          </div>
        </div>
      )}
    </div>
  );
}
