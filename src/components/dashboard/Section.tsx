import { cn } from "@/lib/utils";

/**
 * A dashboard section: a left-aligned title with an optional count and a right
 * slot for controls. Deliberately not an eyebrow-on-everything pattern — the
 * title carries the hierarchy.
 */
export function Section({
  title,
  count,
  action,
  children,
  className,
  id,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24", className)}>
      <div className="mb-3.5 flex items-end justify-between gap-4">
        <h2 className="flex items-baseline gap-2.5 font-display text-[15px] font-bold uppercase tracking-[0.12em] text-muted">
          {title}
          {count != null && (
            <span className="tnum text-[13px] font-semibold tracking-normal text-faint">
              {count}
            </span>
          )}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
