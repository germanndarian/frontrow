"use client";

import type { LeagueId, StandingRow } from "@/lib/types";
import { LEAGUES } from "@/lib/leagues";
import { useStandings } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { TeamLogo } from "@/components/ui/TeamLogo";

/** Numeric value of the emphasis column, for the relative strength bar. */
function strength(row: StandingRow, key: string): number {
  const raw = row.stats[key] ?? "0";
  return parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
}

export function StandingsCard({ league, teamId }: { league: LeagueId; teamId?: string }) {
  const meta = LEAGUES[league];
  const { data, isPending, isError, refetch } = useStandings(league, teamId);

  if (isPending) {
    return (
      <Card>
        <CardHeader title={meta.fullName} eyebrow={meta.name} />
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader title={meta.fullName} eyebrow={meta.name} />
        <ErrorState onRetry={() => refetch()} message={`Couldn't load ${meta.name} standings.`} />
      </Card>
    );
  }

  const emphasisKey =
    meta.standingsColumns.find((c) => c.emphasis)?.key ?? meta.standingsColumns[0].key;
  const maxStrength = Math.max(...data.rows.map((r) => strength(r, emphasisKey)), 1);

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={data.name}
        eyebrow={meta.name}
        action={
          <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-faint">
            {meta.groupNoun}
          </span>
        }
      />
      <div className="mt-2.5 overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line-soft/70 text-[10.5px] uppercase tracking-[0.08em] text-faint">
              <th className="py-1.5 pl-5 pr-1 text-left font-semibold">#</th>
              <th className="py-1.5 pr-2 text-left font-semibold">Team</th>
              {meta.standingsColumns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-2 py-1.5 text-right font-semibold tnum",
                    c.emphasis && "text-muted",
                  )}
                >
                  {c.label}
                </th>
              ))}
              <th className="hidden pr-5 sm:table-cell" />
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr
                key={row.teamId}
                className={cn(
                  "group border-b border-line-soft/40 last:border-0 transition-colors",
                  row.followed ? "bg-primary/[0.08]" : "hover:bg-bg-2/40",
                )}
              >
                <td className="py-2 pl-5 pr-1">
                  <span
                    className={cn(
                      "tnum text-[12px] font-bold",
                      row.followed ? "text-primary-bright" : "text-faint",
                    )}
                  >
                    {row.position}
                  </span>
                </td>
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-2">
                    <TeamLogo src={row.logo} name={row.displayName} abbr={row.abbreviation} size={20} />
                    <span
                      className={cn(
                        "font-semibold",
                        row.followed ? "text-ink" : "text-muted",
                      )}
                    >
                      <span className="sm:hidden">{row.abbreviation}</span>
                      <span className="hidden sm:inline">{row.displayName}</span>
                    </span>
                    {row.followed && (
                      <svg className="h-3 w-3 text-gold" viewBox="0 0 24 24" fill="currentColor" aria-label="Following">
                        <path d="m12 2 2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" />
                      </svg>
                    )}
                  </div>
                </td>
                {meta.standingsColumns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "tnum px-2 py-2 text-right",
                      c.emphasis
                        ? "font-bold text-ink"
                        : "font-medium text-muted",
                    )}
                  >
                    {row.stats[c.key] ?? "—"}
                  </td>
                ))}
                <td className="hidden w-20 pr-5 sm:table-cell">
                  <span className="block h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <span
                      className="block h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      style={{
                        width: `${(strength(row, emphasisKey) / maxStrength) * 100}%`,
                        backgroundColor: row.followed
                          ? "var(--color-primary-bright)"
                          : "var(--color-surface-3)",
                      }}
                    />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
