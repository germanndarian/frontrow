import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "spin inline-block rounded-full border-2 border-surface-3 border-t-primary-bright",
        className,
      )}
      style={{ width: 16, height: 16 }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-6 py-10 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full border border-line/70 bg-bg-2/60 text-faint">
          {icon}
        </div>
      )}
      <p className="font-display text-[15px] font-bold text-ink">{title}</p>
      {body && <p className="max-w-[34ch] text-[13px] leading-relaxed text-muted">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  onRetry,
  className,
  message = "We couldn't reach the scoreboard.",
}: {
  onRetry?: () => void;
  className?: string;
  message?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-9 text-center",
        className,
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-loss/30 bg-loss/10 text-loss">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      </div>
      <div>
        <p className="font-display text-[14px] font-bold text-ink">Something went sideways</p>
        <p className="mt-0.5 max-w-[34ch] text-[13px] text-muted">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-full border border-line bg-surface-2 px-3.5 py-1.5 text-[13px] font-semibold text-ink transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-surface-3 active:scale-[0.97]"
        >
          Try again
        </button>
      )}
    </div>
  );
}
