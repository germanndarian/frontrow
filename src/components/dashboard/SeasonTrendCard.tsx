"use client";

import { useEffect, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FollowedTeam, Outcome, TeamCard as TeamCardData } from "@/lib/types";
import { LEAGUES } from "@/lib/leagues";
import { useTeamCard } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";

const SCORE_NOUN: Record<string, string> = {
  mlb: "Runs",
  nhl: "Goals",
  nfl: "Points",
  "college-football": "Points",
};

/* ── derived-stat helpers ──────────────────────────────────────────────── */

/** Parse an ESPN record string ("37-25" or "11-6-1") into wins/losses/ties. */
function parseRecord(rec: string): { w: number; l: number; t: number } | null {
  const parts = rec.split("-").map((n) => parseInt(n.trim(), 10));
  if (parts.length < 2 || parts.some((n, i) => i < 2 && Number.isNaN(n))) return null;
  return { w: parts[0], l: parts[1], t: Number.isNaN(parts[2]) ? 0 : parts[2] ?? 0 };
}

/** ".597" — win percentage without a leading zero. */
function winPct(w: number, l: number, t: number): string {
  const games = w + l + t;
  if (games === 0) return "—";
  return ((w + t / 2) / games).toFixed(3).replace(/^0/, "");
}

/** Current streak from the form list (most-recent first), e.g. "W3". */
function currentStreak(form: { result: Outcome }[]): { label: string; result: Outcome } | null {
  if (!form.length) return null;
  const result = form[0].result;
  let n = 0;
  for (const g of form) {
    if (g.result === result) n++;
    else break;
  }
  return { label: `${result}${n}`, result };
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/* ── small presentational pieces ───────────────────────────────────────── */

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "win" | "loss" | "default";
}) {
  return (
    <div className="rounded-md border border-line-soft/70 bg-surface-2/50 px-3 py-2.5">
      <div
        className={cn(
          "tnum font-mono text-[17px] font-semibold leading-none",
          tone === "win" && "text-win",
          tone === "loss" && "text-loss",
          (!tone || tone === "default") && "text-ink",
        )}
      >
        {value}
      </div>
      <div className="mt-1.5 text-[10px] uppercase tracking-[0.1em] text-faint">{label}</div>
    </div>
  );
}

function FormGuide({ form }: { form: { result: Outcome; opponentAbbr: string; atVs: string; score: string }[] }) {
  if (!form.length) return null;
  // form is most-recent first; show oldest → newest so it reads as a timeline.
  const ordered = [...form].reverse();
  const tone: Record<Outcome, string> = {
    W: "bg-win/15 text-win",
    L: "bg-loss/15 text-loss",
    T: "bg-surface-3 text-muted",
  };
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">Form</span>
      <div className="flex gap-1.5">
        {ordered.map((g, i) => (
          <span
            key={i}
            title={`${g.result} ${g.atVs} ${g.opponentAbbr} ${g.score}`}
            className={cn(
              "grid h-6 w-6 place-items-center rounded-[7px] text-[11px] font-bold",
              tone[g.result],
            )}
          >
            {g.result}
          </span>
        ))}
      </div>
    </div>
  );
}

interface Tip {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string | number;
}
function ChartTooltip({ active, payload, label }: Tip) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-line bg-bg-2/95 px-2.5 py-1.5 text-[12px] shadow-lg backdrop-blur">
      <div className="mb-0.5 text-faint">Game {label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted">{p.name}</span>
          <span className="tnum ml-auto font-mono font-semibold text-ink">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── card ──────────────────────────────────────────────────────────────── */

function Frame({ follow, children }: { follow: FollowedTeam; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader title={follow.displayName} eyebrow="Season stats" />
      {children}
    </Card>
  );
}

export function SeasonTrendCard({ follow }: { follow: FollowedTeam }) {
  const { data, isPending, isError, refetch } = useTeamCard(follow.league, follow.teamId);
  // Recharts' ResponsiveContainer needs a laid-out parent to measure; gate it
  // behind mount so it never reads a zero/-1 size on the first paint.
  const [mounted, setMounted] = useState(false);
  // Intentional one-shot mount flag; the rule's perf concern about cascading
  // renders doesn't apply to a single post-mount flip.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  const noun = SCORE_NOUN[follow.league] ?? "Points";
  const accent = follow.color === "#0c2340" ? "var(--color-primary-bright)" : follow.color;

  if (isPending) {
    return (
      <Frame follow={follow}>
        <div className="space-y-3 p-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      </Frame>
    );
  }

  if (isError || !data) {
    return (
      <Frame follow={follow}>
        <ErrorState onRetry={() => refetch()} />
      </Frame>
    );
  }

  if (!data.scoring.length) {
    return (
      <Frame follow={follow}>
        <EmptyState
          title="No scoring to chart yet"
          body={
            LEAGUES[follow.league].inSeason
              ? `Per-game ${noun.toLowerCase()} for the ${follow.displayName} will chart here as live data comes in.`
              : `${LEAGUES[follow.league].seasonHint} — season stats return when the season starts.`
          }
        />
      </Frame>
    );
  }

  const { scoring, conceded, form, team } = data as TeamCardData;
  const hasAllowed = !!conceded && conceded.length === scoring.length && conceded.length > 0;

  const avgFor = mean(scoring);
  const avgAgainst = hasAllowed ? mean(conceded!) : 0;
  const diff = avgFor - avgAgainst;
  const rec = parseRecord(team.record);
  const streak = currentStreak(form);

  const series = scoring.map((v, i) => ({
    game: i + 1,
    For: v,
    Against: hasAllowed ? conceded![i] : null,
  }));

  const tiles: { label: string; value: string; tone?: "win" | "loss" | "default" }[] = [
    { label: "Record", value: team.record || "—" },
    { label: "Win %", value: rec ? winPct(rec.w, rec.l, rec.t) : "—" },
    ...(streak
      ? [{ label: "Streak", value: streak.label, tone: streak.result === "W" ? ("win" as const) : streak.result === "L" ? ("loss" as const) : ("default" as const) }]
      : []),
    { label: `${noun}/G`, value: avgFor.toFixed(1) },
    ...(hasAllowed
      ? [
          { label: "Allowed/G", value: avgAgainst.toFixed(1) },
          {
            label: "Diff",
            value: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}`,
            tone: diff >= 0 ? ("win" as const) : ("loss" as const),
          },
        ]
      : []),
  ];

  return (
    <Card>
      <CardHeader
        title={`${follow.displayName} · ${noun} per game`}
        eyebrow="Season stats"
        action={
          team.standingSummary ? (
            <span className="hidden text-[12px] font-medium text-muted sm:inline">
              {team.standingSummary}
            </span>
          ) : undefined
        }
      />

      <div className="space-y-4 px-4 pb-2 pt-4">
        {/* Stat tiles */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {tiles.map((t) => (
            <StatTile key={t.label} label={t.label} value={t.value} tone={t.tone} />
          ))}
        </div>

        <FormGuide form={form} />
      </div>

      <div className="px-2 pb-3 pt-1">
        {!mounted ? (
          <Skeleton className="mx-2 h-[180px]" />
        ) : (
          <ResponsiveContainer width="100%" height={180} minWidth={0}>
            <ComposedChart data={series} margin={{ top: 4, right: 12, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id={`fill-${follow.teamId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.42} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--color-line-soft)" vertical={false} />
              <XAxis
                dataKey="game"
                tick={{ fill: "var(--color-faint)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "var(--color-faint)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={32}
                allowDecimals={false}
              />
              <ReferenceLine y={avgFor} stroke="var(--color-faint)" strokeDasharray="4 4" strokeOpacity={0.6} />
              <Tooltip cursor={{ stroke: "var(--color-line)", strokeWidth: 1 }} content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="For"
                stroke={accent}
                strokeWidth={2.5}
                fill={`url(#fill-${follow.teamId})`}
                dot={{ r: 2.5, fill: accent, strokeWidth: 0 }}
                activeDot={{ r: 4, fill: accent, stroke: "var(--color-bg)", strokeWidth: 2 }}
                animationDuration={700}
              />
              {hasAllowed && (
                <Line
                  type="monotone"
                  dataKey="Against"
                  stroke="var(--color-faint)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={{ r: 3.5, fill: "var(--color-faint)", stroke: "var(--color-bg)", strokeWidth: 2 }}
                  animationDuration={700}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
