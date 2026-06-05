import { cn } from "@/lib/utils";

/**
 * A lightweight inline bar sparkline (no chart library). The most recent bar is
 * emphasized; bars scale to the series max. Used for scoring trends and a
 * player's recent output.
 */
export function BarSparkline({
  values,
  color = "var(--color-primary-bright)",
  height = 36,
  className,
}: {
  values: number[];
  color?: string;
  height?: number;
  className?: string;
}) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  return (
    <div
      className={cn("flex items-end gap-[3px]", className)}
      style={{ height }}
      aria-hidden
    >
      {values.map((v, i) => {
        const isLast = i === values.length - 1;
        const h = Math.max(8, (v / max) * 100);
        return (
          <span
            key={i}
            className="flex-1 rounded-[3px] transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              height: `${h}%`,
              backgroundColor: isLast ? color : "var(--color-surface-3)",
              opacity: isLast ? 1 : 0.85,
            }}
          />
        );
      })}
    </div>
  );
}
