"use client";

import type { FollowedTeam, Outcome } from "@/lib/types";
import { useTeamCard } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

const SCORE_NOUN: Record<string, string> = {
  mlb: "Runs",
  nhl: "Goals",
  nfl: "Points",
  "college-football": "Points",
};

/* ── derived-stat helpers ──────────────────────────────────────────────── */

function parseRecord(rec: string): { w: number; l: number; t: number } | null {
  const parts = rec.split("-").map((n) => parseInt(n.trim(), 10));
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
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

/* ── presentational pieces ─────────────────────────────────────────────── */

function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "win" | "loss" | "default";
}) {
  return (
    <div className="rounded-md border border-line-soft/70 bg-surface-2/50 px-3 py-2.5">
      <div
        className={cn(
          "tnum font-mono text-[18px] font-semibold leading-none",
          tone === "win" && "text-win",
          tone === "loss" && "text-loss",
          tone === "default" && "text-ink",
        )}
      >
        {value}
      </div>
      <div className="mt-1.5 text-[10px] uppercase tracking-[0.1em] text-faint">{label}</div>
    </div>
  );
}

function FormGuide({
  form,
}: {
  form: { result: Outcome; opponentAbbr: string; atVs: string; score: string }[];
}) {
  if (!form.length) return null;
  // form is most-recent first; show oldest → newest so it reads as a timeline.
  const ordered = [...form].reverse();
  const tone: Record<Outcome, string> = {
    W: "bg-win/15 text-win",
    L: "bg-loss/15 text-loss",
    T: "bg-surface-3 text-muted",
  };
  return (
    <div className="flex gap-1.5">
      {ordered.map((g, i) => (
        <span
          key={i}
          title={`${g.result} ${g.atVs} ${g.opponentAbbr} ${g.score}`}
          className={cn(
            "grid h-7 w-7 place-items-center rounded-[8px] text-[12px] font-bold",
            tone[g.result],
          )}
        >
          {g.result}
        </span>
      ))}
    </div>
  );
}

/* ── cards ─────────────────────────────────────────────────────────────── */

function StatCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[0, 1].map((i) => (
        <Card key={i} className="p-4">
          <Skeleton className="mb-3 h-4 w-28" />
          <Skeleton className="h-16 w-full" />
        </Card>
      ))}
    </div>
  );
}

export function TeamStatCards({ follow }: { follow: FollowedTeam }) {
  const { data, isPending } = useTeamCard(follow.league, follow.teamId);
  const noun = SCORE_NOUN[follow.league] ?? "Points";

  if (isPending) return <StatCardsSkeleton />;
  // No card noise on error/empty — the trend chart below surfaces those states.
  if (!data) return null;

  const { team, form, scoring, conceded } = data;
  const rec = parseRecord(team.record);
  const streak = currentStreak(form);
  const hasScoring = scoring.length > 0;
  const hasAllowed = !!conceded && conceded.length === scoring.length && conceded.length > 0;
  if (!rec && !form.length && !hasScoring) return null;

  const avgFor = mean(scoring);
  const avgAgainst = hasAllowed ? mean(conceded!) : 0;
  const diff = avgFor - avgAgainst;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Record & form */}
      <Card>
        <CardHeader
          title="Record & form"
          eyebrow="Season"
          action={
            team.standingSummary ? (
              <span className="text-[12px] font-medium text-muted">{team.standingSummary}</span>
            ) : undefined
          }
        />
        <div className="p-4">
          <div className="flex items-end gap-4">
            <div>
              <div className="tnum font-display text-[30px] font-extrabold leading-none tracking-[-0.02em] text-ink">
                {team.record || "—"}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-faint">
                Record
              </div>
            </div>
            <div>
              <div className="tnum font-mono text-[20px] font-semibold leading-none text-ink">
                {rec ? winPct(rec.w, rec.l, rec.t) : "—"}
              </div>
              <div className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-faint">Win %</div>
            </div>
            {streak && (
              <span
                className={cn(
                  "ml-auto rounded-full px-2.5 py-1 text-[12px] font-bold",
                  streak.result === "W" && "bg-win/15 text-win",
                  streak.result === "L" && "bg-loss/15 text-loss",
                  streak.result === "T" && "bg-surface-3 text-muted",
                )}
                title="Current streak"
              >
                {streak.label}
              </span>
            )}
          </div>
          {form.length > 0 && (
            <div className="mt-4">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
                Last {form.length}
              </div>
              <FormGuide form={form} />
            </div>
          )}
        </div>
      </Card>

      {/* Scoring */}
      <Card>
        <CardHeader title="Scoring" eyebrow="Per game" />
        <div className="p-4">
          {hasScoring ? (
            <div className="grid grid-cols-3 gap-2">
              <StatTile label={`${noun}/G`} value={avgFor.toFixed(1)} />
              {hasAllowed && <StatTile label="Allowed/G" value={avgAgainst.toFixed(1)} />}
              {hasAllowed && (
                <StatTile
                  label="Diff"
                  value={`${diff >= 0 ? "+" : ""}${diff.toFixed(1)}`}
                  tone={diff >= 0 ? "win" : "loss"}
                />
              )}
              <StatTile label="High" value={String(Math.max(...scoring))} />
              {!hasAllowed && <StatTile label="Low" value={String(Math.min(...scoring))} />}
              <StatTile label="Total" value={String(scoring.reduce((a, b) => a + b, 0))} />
            </div>
          ) : (
            <p className="text-[13px] text-muted">No scoring logged yet this season.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
