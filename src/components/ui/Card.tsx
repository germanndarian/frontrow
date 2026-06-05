import { cn } from "@/lib/utils";

/**
 * The single surface primitive. One elevation, a hairline border, generous
 * radius. Cards are never nested inside cards — sections inside a card use
 * dividers and spacing, not another surface.
 */
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line/70 bg-surface/70 backdrop-blur-sm",
        "shadow-[0_1px_0_0_oklch(1_0_0/0.04)_inset,0_18px_40px_-24px_oklch(0_0_0/0.7)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  eyebrow,
  action,
  className,
}: {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 px-5 pt-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
            {eyebrow}
          </div>
        )}
        <h3 className="truncate font-display text-[15px] font-bold tracking-tight text-ink">
          {title}
        </h3>
      </div>
      {action}
    </div>
  );
}
