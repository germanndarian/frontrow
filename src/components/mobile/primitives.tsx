"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

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
        "flex-none rounded-full px-[15px] py-2 text-[12.5px] font-bold transition-[transform,background-color,color] active:scale-95",
        on ? "border border-primary bg-primary text-primary-ink" : "glass text-muted",
      )}
    >
      {label}
    </button>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <div data-hscroll className="no-scrollbar flex gap-2 overflow-x-auto px-[18px] pb-1 pt-3.5">{children}</div>;
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

/* ── Skeletons shaped like the cards they stand in for ──────────────────── */

function Line({ w, h = 12, className }: { w: string; h?: number; className?: string }) {
  return <Skeleton className={cn("rounded-full", className)} style={{ width: w, height: h }} />;
}

export function GameRowSkeleton() {
  return (
    <div className="rounded-[20px] border border-line bg-surface p-4">
      <div className="mb-3.5 flex items-center justify-between"><Line w="34px" h={10} /><Line w="64px" h={10} /></div>
      {[0, 1].map((i) => (
        <div key={i} className={cn("flex items-center gap-3", i === 0 && "mb-[11px]")}>
          <Skeleton className="h-[34px] w-[34px] rounded-[10px]" />
          <span className="flex-1"><Line w="55%" h={14} /><Line w="30%" h={10} className="mt-1.5" /></span>
          <Line w="22px" h={26} />
        </div>
      ))}
      <div className="mt-3.5 flex justify-between border-t border-line-soft pt-3"><Line w="38%" h={11} /><Line w="28%" h={11} /></div>
    </div>
  );
}

export function TeamCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-line bg-surface">
      <div className="flex items-center gap-3 px-4 pb-[15px] pt-[17px]">
        <Skeleton className="h-[46px] w-[46px] rounded-[14px]" />
        <span className="flex-1"><Line w="60%" h={16} /><Line w="40%" h={11} className="mt-2" /></span>
        <span className="text-right"><Line w="48px" h={14} /><Line w="28px" h={9} className="ml-auto mt-2" /></span>
      </div>
      <div className="px-4 pb-4 pt-1">
        <Line w="80px" h={9} className="mb-2.5" />
        <div className="flex gap-1.5">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[30px] flex-1 rounded-[9px]" />)}</div>
        <div className="mt-4 grid grid-cols-2 gap-2.5"><Skeleton className="h-[78px] rounded-[14px]" /><Skeleton className="h-[78px] rounded-[14px]" /></div>
      </div>
      <div className="border-t border-line-soft py-3.5"><Line w="90px" h={12} className="mx-auto" /></div>
    </div>
  );
}

export function PlayerCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-line bg-surface">
      <div className="flex items-center gap-[13px] p-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <span className="flex-1"><Line w="55%" h={16} /><Line w="40%" h={11} className="mt-2" /></span>
        <Skeleton className="h-[26px] w-[52px] rounded-full" />
      </div>
      <div className="mx-4 grid grid-cols-3 gap-px overflow-hidden rounded-[14px] border border-line-soft bg-line-soft">
        {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="bg-surface px-3 py-[11px]"><Line w="40%" h={9} /><Line w="55%" h={18} className="mt-2" /></div>)}
      </div>
      <div className="px-4 pb-4 pt-3.5">
        <div className="mb-2 flex justify-between"><Line w="90px" h={9} /><Skeleton className="h-[22px] w-[90px] rounded" /></div>
        {[0, 1, 2].map((i) => <div key={i} className="flex items-center gap-[9px] border-t border-line-soft/70 py-[9px]"><Line w="12px" h={11} /><Skeleton className="h-5 w-5 rounded-[6px]" /><Line w="48px" h={11} /><Line w="110px" h={11} className="ml-auto" /></div>)}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
      <div className="px-4 pb-3 pt-4"><Line w="90px" h={9} /><Line w="120px" h={17} className="mt-2" /></div>
      <div className="flex items-center gap-2 border-b border-line-soft px-4 pb-2"><Line w="10px" h={9} /><Line w="40px" h={9} className="flex-1" />{[0, 1, 2, 3].map((i) => <Line key={i} w="26px" h={9} />)}</div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 border-b border-line-soft/70 px-4 py-[11px]">
          <Line w="10px" h={12} /><Skeleton className="h-6 w-6 rounded-[7px]" /><Line w="34%" h={13} className="flex-1" />{[0, 1, 2, 3].map((j) => <Line key={j} w="28px" h={12} />)}
        </div>
      ))}
    </div>
  );
}
