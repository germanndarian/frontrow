import { cn } from "@/lib/utils";

/**
 * FRONTROW wordmark. The mark reads as a single seat (the live-red dot, you in
 * the front row) tracking the action ahead (a cobalt double-chevron =
 * forward / skip-to-live). Display type, tight tracking, FRONT solid + ROW muted.
 */
export function Wordmark({
  className,
  showMark = true,
}: {
  className?: string;
  showMark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {showMark && (
        <span className="relative grid h-7 w-7 place-items-center rounded-[8px] bg-primary/14 ring-1 ring-inset ring-primary/30">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="5.4" cy="12" r="1.95" fill="var(--color-live)" />
            <path
              d="M10 7.2 14.6 12 10 16.8"
              stroke="var(--color-primary-bright)"
              strokeOpacity="0.5"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15.2 7.2 19.8 12 15.2 16.8"
              stroke="var(--color-primary-bright)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
      <span className="font-display text-[19px] font-extrabold leading-none tracking-[-0.02em] text-ink">
        FRONT<span className="text-muted">ROW</span>
      </span>
    </span>
  );
}
