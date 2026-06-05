"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FollowedTeam } from "@/lib/types";
import { LEAGUES } from "@/lib/leagues";
import { useTeamCard } from "@/lib/queries";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";

const SCORE_NOUN: Record<string, string> = {
  mlb: "Runs",
  nhl: "Goals",
  nfl: "Points",
  "college-football": "Points",
};

interface TooltipPayload {
  active?: boolean;
  payload?: { value: number }[];
  label?: string | number;
}

function ChartTooltip({ active, payload, label, noun }: TooltipPayload & { noun: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-line bg-bg-2/95 px-2.5 py-1.5 text-[12px] shadow-lg backdrop-blur">
      <div className="text-faint">Game {label}</div>
      <div className="tnum font-mono font-semibold text-ink">
        {payload[0].value} {noun.toLowerCase()}
      </div>
    </div>
  );
}

export function SeasonTrendCard({ follow }: { follow: FollowedTeam }) {
  const { data, isPending, isError, refetch } = useTeamCard(follow.league, follow.teamId);
  // Recharts' ResponsiveContainer needs a laid-out parent to measure; gate it
  // behind mount so it never reads a zero/-1 size on the first paint.
  const [mounted, setMounted] = useState(false);
  // Intentional one-shot mount flag (see comment above); the rule's perf concern
  // about cascading renders doesn't apply to a single post-mount flip.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  const noun = SCORE_NOUN[follow.league] ?? "Points";
  const accent =
    follow.color === "#0c2340" ? "var(--color-primary-bright)" : follow.color;

  if (isPending) {
    return (
      <Card>
        <CardHeader title={follow.displayName} eyebrow="Season trend" />
        <div className="p-4">
          <Skeleton className="h-44 w-full" />
        </div>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader title={follow.displayName} eyebrow="Season trend" />
        <ErrorState onRetry={() => refetch()} />
      </Card>
    );
  }

  if (!data.scoring.length) {
    return (
      <Card>
        <CardHeader title={follow.displayName} eyebrow="Season trend" />
        <EmptyState
          title="No scoring to chart yet"
          body={
            LEAGUES[follow.league].inSeason
              ? `Per-game ${noun.toLowerCase()} for the ${follow.displayName} will chart here as live data comes in.`
              : `${LEAGUES[follow.league].seasonHint} — the scoring trend returns when the season starts.`
          }
        />
      </Card>
    );
  }

  const series = data.scoring.map((value, i) => ({ game: i + 1, value }));
  const avg = data.scoring.reduce((a, b) => a + b, 0) / data.scoring.length;
  const high = Math.max(...data.scoring);
  const total = data.scoring.reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader
        title={`${follow.displayName} · ${noun} per game`}
        eyebrow="Season trend"
        action={
          <div className="flex gap-4 text-right">
            {[
              { k: "Avg", v: avg.toFixed(1) },
              { k: "High", v: String(high) },
              { k: "Total", v: String(total) },
            ].map((s) => (
              <div key={s.k}>
                <div className="tnum font-mono text-[15px] font-semibold text-ink">{s.v}</div>
                <div className="text-[10px] uppercase tracking-[0.1em] text-faint">{s.k}</div>
              </div>
            ))}
          </div>
        }
      />
      <div className="px-2 pb-3 pt-4">
        {!mounted ? (
          <Skeleton className="h-[180px] w-full" />
        ) : (
        <ResponsiveContainer width="100%" height={180} minWidth={0}>
          <AreaChart data={series} margin={{ top: 4, right: 12, bottom: 0, left: -18 }}>
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
            <ReferenceLine
              y={avg}
              stroke="var(--color-faint)"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
            />
            <Tooltip
              cursor={{ stroke: "var(--color-line)", strokeWidth: 1 }}
              content={<ChartTooltip noun={noun} />}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={accent}
              strokeWidth={2.5}
              fill={`url(#fill-${follow.teamId})`}
              dot={{ r: 2.5, fill: accent, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: accent, stroke: "var(--color-bg)", strokeWidth: 2 }}
              animationDuration={700}
            />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
