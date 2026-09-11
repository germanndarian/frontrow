"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { useMotionPref } from "@/lib/motion-pref";
import { Mark } from "./primitives";

/* Bottom sheet chrome shared by the schedule, bracket and player views: a
   scrim that fades, a translucent panel that springs up from the bottom, and
   a header with the team/player mark, title, subtitle and a close button.
   Render inside <AnimatePresence> so closing plays in reverse. */

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
  const reduce = useMotionPref();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-ink/40 backdrop-blur-[3px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.2 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[80dvh] flex-col overflow-hidden rounded-t-[26px] bg-surface/92 backdrop-blur-[24px]"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 40, mass: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-9 flex-none rounded-full bg-ink/15" aria-hidden />
        <div className="relative flex items-center gap-3 border-b border-line-soft px-[18px] pb-[15px] pt-3">
          <div className="absolute inset-0" style={{ background: `linear-gradient(105deg, color-mix(in oklab, ${color} 20%, transparent), transparent 60%)` }} />
          <Mark abbr={abbr} color={color} size={38} radius={12} font={10} className="relative" />
          <div className="relative min-w-0 flex-1">
            <h2 className="m-0 truncate font-display text-[16.5px] font-extrabold text-ink">{title}</h2>
            {subtitle && <p className="m-0 mt-0.5 text-[12px] text-faint">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="glass relative grid h-[34px] w-[34px] flex-none place-items-center rounded-full text-[15px] text-muted active:scale-95">
            ✕
          </button>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto" style={{ paddingBottom: "max(34px, calc(env(safe-area-inset-bottom) + 18px))" }}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function SheetGroupLabel({ children }: { children: React.ReactNode }) {
  return <div className="sticky top-0 bg-surface/95 px-[18px] py-2.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-faint backdrop-blur-[10px]">{children}</div>;
}
