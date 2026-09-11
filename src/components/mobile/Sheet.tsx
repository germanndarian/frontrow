"use client";

import { useEffect } from "react";
import { Mark } from "./primitives";

/* Bottom sheet chrome shared by the schedule, bracket and player views: a
   scrim, a rounded panel that rises from the bottom, and a header with the
   team/player mark, title, subtitle and a close button. */

export function Sheet({
  abbr,
  color,
  title,
  subtitle,
  onClose,
  children,
}: {
  abbr: string;
  color: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-ink/42 backdrop-blur-[2px]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="rise flex max-h-[80dvh] flex-col overflow-hidden rounded-t-[26px] bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center gap-3 border-b border-line-soft px-[18px] pb-[15px] pt-[18px]">
          <div className="absolute inset-0" style={{ background: `linear-gradient(105deg, color-mix(in oklab, ${color} 20%, transparent), transparent 60%)` }} />
          <Mark abbr={abbr} color={color} size={38} radius={12} font={10} className="relative" />
          <div className="relative min-w-0 flex-1">
            <h2 className="m-0 truncate font-display text-[16.5px] font-extrabold text-ink">{title}</h2>
            {subtitle && <p className="m-0 mt-0.5 text-[12px] text-faint">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="relative grid h-[34px] w-[34px] flex-none place-items-center rounded-full bg-bg-2 text-[15px] text-muted">
            ✕
          </button>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto" style={{ paddingBottom: "max(34px, calc(env(safe-area-inset-bottom) + 18px))" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function SheetGroupLabel({ children }: { children: React.ReactNode }) {
  return <div className="sticky top-0 bg-surface/95 px-[18px] py-2.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-faint">{children}</div>;
}
