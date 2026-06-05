"use client";

import { useState } from "react";
import type { FollowedTeam } from "@/lib/types";
import { LEAGUES } from "@/lib/leagues";
import { useTeamCard } from "@/lib/queries";
import { cn, relativeTime, clockTime } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { OutcomeChip } from "@/components/ui/Badge";
import { BarSparkline } from "@/components/ui/Sparkline";
import { ScheduleModal } from "./ScheduleModal";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
      {children}
    </div>
  );
}

export function TeamCardView({
  follow,
  selected = false,
  onSelect,
}: {
  follow: FollowedTeam;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const { data, isPending, isError, refetch } = useTeamCard(follow.league, follow.teamId);
  const league = LEAGUES[follow.league];
  const [scheduleOpen, setScheduleOpen] = useState(false);

  if (isPending) {
    return (
      <Card className="p-0">
        <div className="flex items-center gap-3 p-4">
          <Skeleton className="h-11 w-11 rounded-[28%]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="space-y-3 px-4 pb-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <ErrorState onRetry={() => refetch()} message={`Couldn't load ${follow.displayName}.`} />
      </Card>
    );
  }

  const { team, form, next, scoring } = data;
  const offseason = !league.inSeason;

  return (
    <>
    <Card
      className={cn(
        "cursor-pointer overflow-hidden transition-[box-shadow,border-color] duration-200",
        selected
          ? "border-primary/55 shadow-[0_0_0_1px_var(--color-primary),0_0_0_4px_oklch(0.645_0.168_257/0.16),0_18px_44px_-24px_oklch(0.645_0.168_257/0.5)]"
          : "hover:border-line",
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`Feature ${follow.displayName} in season stats`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
    >
      {/* Header with a restrained team-color wash */}
      <div className="relative flex items-center gap-3 px-4 pt-4 pb-3.5">
        <div
          className="pointer-events-none absolute inset-0 -z-0 opacity-90"
          style={{
            background: `linear-gradient(105deg, color-mix(in oklab, ${team.color} 24%, transparent), transparent 62%)`,
          }}
        />
        <TeamLogo src={team.logo} name={team.displayName} abbr={team.abbreviation} color={team.color} size={44} className="relative" />
        <div className="relative min-w-0 flex-1">
          <h3 className="truncate font-display text-[17px] font-extrabold leading-tight tracking-tight text-ink">
            {team.displayName}
          </h3>
          <p className="truncate text-[12.5px] font-medium text-muted">{team.standingSummary}</p>
        </div>
        <div className="relative shrink-0 text-right">
          <div className="tnum font-mono text-[15px] font-semibold text-ink">{team.record}</div>
          <div className="text-[10.5px] uppercase tracking-[0.1em] text-faint">{league.name}</div>
        </div>
      </div>

      {data.placeholder ? (
        <EmptyState
          className="!py-7"
          title="You're following them"
          body={`Recent form, fixtures and standings for the ${team.name} unlock when the live ESPN feed is connected.`}
        />
      ) : (
      <div className="grid gap-4 px-4 pb-4 pt-1">
        {/* Form guide */}
        <div>
          <FieldLabel>{offseason ? "Last 5 · 2025" : "Recent form"}</FieldLabel>
          <div className="flex gap-1.5">
            {form.map((f, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <OutcomeChip result={f.result} className="h-7 w-full" />
                <span className="text-[10px] font-medium text-faint">
                  {f.atVs === "@" ? "@" : ""}
                  {f.opponentAbbr}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Next fixture + scoring trend */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-line-soft/70 bg-bg-2/40 p-3">
            <FieldLabel>{offseason ? "Season opener" : "Next up"}</FieldLabel>
            {next ? (
              <div className="flex items-center gap-2">
                <TeamLogo src={next.opponentLogo} name={next.opponentName} abbr={next.opponentAbbr} size={22} />
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold text-ink">
                    {next.atVs === "@" ? "@ " : "vs "}
                    {next.opponentAbbr}
                  </div>
                  <div className="text-[11px] text-faint">
                    {relativeTime(next.date)} · {clockTime(next.date)}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-faint">To be scheduled</p>
            )}
          </div>

          <div className="rounded-md border border-line-soft/70 bg-bg-2/40 p-3">
            <FieldLabel>{scoring.length ? "Scoring · last 10" : "Standing"}</FieldLabel>
            {scoring.length ? (
              <BarSparkline values={scoring} color={team.color === "#0c2340" ? "var(--color-primary-bright)" : team.color} height={30} />
            ) : (
              <p className={cn("text-[12.5px] font-semibold", "text-muted")}>{team.standingSummary}</p>
            )}
          </div>
        </div>
      </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          setScheduleOpen(true);
        }}
        className="flex w-full items-center justify-center gap-1.5 border-t border-line-soft/70 px-4 py-2.5 text-[12.5px] font-semibold text-muted transition-colors duration-150 hover:bg-bg-2/50 hover:text-ink"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        View full schedule
      </button>
    </Card>

    <ScheduleModal
      open={scheduleOpen}
      onClose={() => setScheduleOpen(false)}
      league={team.league}
      teamId={team.id}
      teamName={team.displayName}
      teamLogo={team.logo}
      teamAbbr={team.abbreviation}
      teamColor={team.color}
    />
    </>
  );
}
