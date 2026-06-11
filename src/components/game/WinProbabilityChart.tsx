"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GameSide, WinProbPoint } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { TeamLogo } from "@/components/ui/TeamLogo";

/** A team's own color, unless it's so dark it disappears on the dark theme. */
function accentFor(color: string): string {
  return color === "#0c2340" || color === "#000000" ? "var(--color-primary-bright)" : color;
}

interface TipProps {
  active?: boolean;
  payload?: { value: number }[];
  homeAbbr: string;
  awayAbbr: string;
}

function ChartTooltip({ active, payload, homeAbbr, awayAbbr }: TipProps) {
  if (!active || !payload?.length) return null;
  const home = payload[0].value;
  return (
    <div className="rounded-md border border-line bg-bg-2/95 px-2.5 py-1.5 text-[12px] shadow-lg backdrop-blur">
      <div className="tnum font-mono font-semibold text-ink">
        {homeAbbr} {Math.round(home)}%
      </div>
      <div className="tnum font-mono text-faint">
        {awayAbbr} {Math.round(100 - home)}%
      </div>
    </div>
  );
}

export function WinProbabilityChart({
  home,
  away,
  points,
}: {
  home: GameSide;
  away: GameSide;
  points: WinProbPoint[];
}) {
  // ResponsiveContainer needs a laid-out parent to measure; gate behind mount.
  const [mounted, setMounted] = useState(false);
  // Intentional one-shot mount flag — a single post-mount flip, not a cascade.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const accent = accentFor(home.color);
  const current = points.length ? points[points.length - 1].home : 50;

  return (
    <Card>
      <CardHeader
        title="Win Probability"
        eyebrow="Live model"
        action={
          <div className="flex items-center gap-3 text-right">
            <div className="flex items-center gap-1.5">
              <TeamLogo src={home.logo} name={home.displayName} abbr={home.abbreviation} color={home.color} size={18} />
              <span className="tnum font-mono text-[15px] font-semibold text-ink">
                {Math.round(current)}%
              </span>
            </div>
            <span className="text-faint">·</span>
            <div className="flex items-center gap-1.5">
              <span className="tnum font-mono text-[15px] font-semibold text-muted">
                {Math.round(100 - current)}%
              </span>
              <TeamLogo src={away.logo} name={away.displayName} abbr={away.abbreviation} color={away.color} size={18} />
            </div>
          </div>
        }
      />

      {points.length < 2 ? (
        <EmptyState
          title="No win probability yet"
          body="The model's curve appears once the game is underway."
        />
      ) : (
        <div className="px-2 pb-3 pt-4">
          {!mounted ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200} minWidth={0}>
              <AreaChart data={points} margin={{ top: 4, right: 12, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="wp-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="i" hide />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 50, 100]}
                  tick={{ fill: "var(--color-faint)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={34}
                  tickFormatter={(v) => `${v}%`}
                />
                <ReferenceLine y={50} stroke="var(--color-line)" strokeDasharray="4 4" />
                <Tooltip
                  cursor={{ stroke: "var(--color-line)", strokeWidth: 1 }}
                  content={<ChartTooltip homeAbbr={home.abbreviation} awayAbbr={away.abbreviation} />}
                />
                <Area
                  type="monotone"
                  dataKey="home"
                  stroke={accent}
                  strokeWidth={2.5}
                  fill="url(#wp-fill)"
                  dot={false}
                  activeDot={{ r: 4, fill: accent, stroke: "var(--color-bg)", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <p className="px-3 pt-1 text-[11px] text-faint">
            {home.abbreviation} win probability through the game. The midline is a coin flip.
          </p>
        </div>
      )}
    </Card>
  );
}
