"use client";

import { cn } from "@/lib/utils";

/* Small building blocks the iOS screens share: the abbreviation tile, filter
   chips, section rules, stat tiles, bar charts, switches and segmented
   controls. All styled with the semantic tokens so theme + accent apply. */

export function Mark({
  abbr,
  color,
  size = 34,
  radius = 10,
  font = 9,
  className,
}: {
  abbr: string;
  color: string;
  size?: number;
  radius?: number;
  font?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("grid flex-none place-items-center font-mono font-bold text-white", className)}
      style={{ width: size, height: size, borderRadius: radius, background: color, fontSize: font }}
    >
      {abbr}
    </span>
  );
}

export function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-none rounded-full border px-[15px] py-2 text-[12.5px] font-bold transition-colors",
        on ? "border-primary bg-primary text-primary-ink" : "border-line bg-surface text-muted",
      )}
    >
      {label}
    </button>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="no-scrollbar flex gap-2 overflow-x-auto px-[18px] pb-1 pt-3.5">{children}</div>;
}

export function Rule({ title, count, accent }: { title: string; count?: string; accent?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <h2 className="m-0 font-display text-[13px] font-extrabold tracking-[0.06em] text-ink">{title}</h2>
      {count && (
        <span className="font-mono text-[11px] font-bold" style={{ color: accent ?? "var(--color-faint)" }}>
          {count}
        </span>
      )}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("text-[10.5px] font-semibold uppercase tracking-[0.12em] text-faint", className)}>
      {children}
    </div>
  );
}

export function Panel({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("rounded-[20px] border border-line bg-surface", className)} style={style}>
      {children}
    </div>
  );
}

export function StatTile({ value, label, ink }: { value: string; label: string; ink?: string }) {
  return (
    <div className="rounded-[13px] border border-line-soft bg-bg-2/60 px-3 py-[11px]">
      <div className="font-mono text-[18px] font-semibold leading-none text-ink" style={ink ? { color: ink } : undefined}>
        {value}
      </div>
      <div className="mt-1.5 text-[10px] uppercase tracking-[0.1em] text-faint">{label}</div>
    </div>
  );
}

/** Bar chart drawn with divs, like the mockup: each bar's height is a share of the max. */
export function Bars({ values, color, height = 32, gap = 3, radius = 2, className }: { values: number[]; color: string; height?: number; gap?: number; radius?: number; className?: string }) {
  const top = Math.max(...values, 1);
  return (
    <div className={cn("flex items-end", className)} style={{ height, gap }}>
      {values.map((v, i) => (
        <span
          key={i}
          className="flex-1"
          style={{ height: `${Math.max(6, Math.round((v / top) * 100))}%`, background: color, borderRadius: radius }}
        />
      ))}
    </div>
  );
}

export function Switch({ on, onToggle, label, hint }: { on: boolean; onToggle: () => void; label: string; hint?: string }) {
  return (
    <button type="button" onClick={onToggle} role="switch" aria-checked={on} className="flex w-full items-center justify-between gap-3.5 py-2 text-left">
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-[12px] text-faint">{hint}</span>}
      </span>
      <span className={cn("relative h-7 w-[46px] flex-none rounded-full transition-colors", on ? "bg-primary" : "bg-line")}>
        <span
          className="absolute left-[3px] top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.3)] transition-transform duration-200 ease-[cubic-bezier(.23,1,.32,1)]"
          style={{ transform: on ? "translateX(18px)" : "none" }}
        />
      </span>
    </button>
  );
}

export function Segmented<T extends string>({ label, hint, value, options, onChange }: { label: string; hint?: string; value: T; options: { label: string; value: T }[]; onChange: (v: T) => void }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2.5">
        <span className="text-[13.5px] font-semibold text-ink">{label}</span>
        {hint && <span className="text-right text-[11.5px] text-faint">{hint}</span>}
      </div>
      <div className="flex gap-1 rounded-full border border-line bg-bg-2 p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn("flex-1 rounded-full py-[9px] text-[12.5px] font-semibold transition-colors", value === o.value ? "bg-primary text-primary-ink" : "text-muted")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PillButton({ children, onClick, variant = "primary", className, type = "button", disabled }: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "danger"; className?: string; type?: "button" | "submit"; disabled?: boolean }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full rounded-full py-[15px] text-[14.5px] font-semibold transition-[transform,opacity] active:scale-[0.98] disabled:opacity-60",
        variant === "primary" && "bg-primary text-primary-ink font-bold",
        variant === "ghost" && "border border-line bg-surface text-muted",
        variant === "danger" && "border border-loss/30 bg-loss/8 text-loss",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Outcome({ result }: { result: "W" | "L" | "T" }) {
  return (
    <span className={cn("font-mono font-bold", result === "W" ? "text-win" : result === "L" ? "text-loss" : "text-muted")}>
      {result}
    </span>
  );
}
