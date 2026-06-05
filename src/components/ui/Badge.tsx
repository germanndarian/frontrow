import { cn } from "@/lib/utils";
import type { GameState, Outcome } from "@/lib/types";

/** The broadcast LIVE tag: pulsing dot + label, reserved for in-progress games. */
export function LiveBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-live/12 px-2 py-0.5",
        "text-[11px] font-bold uppercase tracking-[0.1em] text-live",
        className,
      )}
    >
      <span className="live-dot" />
      Live
    </span>
  );
}

export function StatusTag({
  state,
  label,
}: {
  state: GameState;
  label: string;
}) {
  if (state === "in") return <LiveBadge />;
  if (state === "post")
    return (
      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-faint">
        {label}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
      {label}
    </span>
  );
}

const OUTCOME_STYLES: Record<Outcome, string> = {
  W: "bg-win/14 text-win",
  L: "bg-loss/14 text-loss",
  T: "bg-surface-3 text-muted",
};

/** Compact W/L/T chip used in form guides and game logs. */
export function OutcomeChip({
  result,
  className,
}: {
  result: Outcome;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-[6px] text-[11px] font-bold tnum",
        OUTCOME_STYLES[result],
        className,
      )}
    >
      {result}
    </span>
  );
}

export function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-line/70 bg-bg-2/60 px-2.5 py-1 text-[12px] font-medium text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Small amber crown marker for a league-leading rank (#1). */
export function RankDot({ rank }: { rank?: number }) {
  if (rank == null) return null;
  const lead = rank === 1;
  return (
    <span
      className={cn(
        "tnum rounded-[5px] px-1.5 py-0.5 text-[10px] font-bold leading-none",
        lead ? "bg-gold/16 text-gold" : "bg-surface-2 text-faint",
      )}
      title={`League rank: ${rank}`}
    >
      {lead ? "#1" : `#${rank}`}
    </span>
  );
}
