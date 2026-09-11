"use client";

import { motion } from "motion/react";
import { useMotionPref } from "@/lib/motion-pref";

export type TabKey = "scores" | "teams" | "players" | "standings" | "settings";

/* Each tab's glyph is two strokes from the design: a scoreboard, a shield
   with a check, a person, a table grid, a gear. */
export const TABS: { key: TabKey; label: string; title: string; d: string; d2: string }[] = [
  { key: "scores", label: "Scores", title: "Live & Upcoming", d: "M4 5.5h16v10.5H4z", d2: "M12 16v3 M8.5 19.5h7" },
  { key: "teams", label: "Teams", title: "Your Teams", d: "M12 3.2l7 2.8v5.2c0 4-2.9 6.9-7 8-4.1-1.1-7-4-7-8V6l7-2.8z", d2: "M9.5 11.8l1.9 1.9 3.4-3.7" },
  { key: "players", label: "Players", title: "Your Players", d: "M12 4.2a3.4 3.4 0 110 6.8 3.4 3.4 0 010-6.8z", d2: "M4.8 20c0-3.5 3.1-5.6 7.2-5.6s7.2 2.1 7.2 5.6" },
  { key: "standings", label: "Table", title: "Around the League", d: "M4 5.5h16v13H4z", d2: "M4 10h16 M4 14.2h16 M9.6 5.5v13" },
  { key: "settings", label: "Settings", title: "Settings", d: "M12 9.4a2.6 2.6 0 110 5.2 2.6 2.6 0 010-5.2z", d2: "M12 3.4v2.6 M12 18v2.6 M4.6 7.7l2.2 1.3 M17.2 15l2.2 1.3 M4.6 16.3l2.2-1.3 M17.2 9l2.2-1.3" },
];

/** iOS 26-style floating tab bar: a glass capsule hovering above the content,
    a glass lens sliding behind the active tab. Content scrolls underneath. */
export function TabBar({ tab, onTab }: { tab: TabKey; onTab: (t: TabKey) => void }) {
  const reduce = useMotionPref();
  return (
    <nav
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-4"
      style={{ paddingBottom: "max(12px, calc(env(safe-area-inset-bottom) + 4px))" }}
      aria-label="Sections"
    >
      <div className="glass pointer-events-auto flex w-full max-w-[430px] rounded-full p-1.5">
        {TABS.map((t) => {
          const on = tab === t.key;
          const ink = on ? "var(--color-primary)" : "var(--color-muted)";
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onTab(t.key)}
              aria-current={on ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center gap-[3px] rounded-full px-1 pb-1.5 pt-2 transition-transform active:scale-95"
            >
              {on && (
                <motion.span
                  layoutId="tab-lens"
                  className="glass-lens absolute inset-0 rounded-full"
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 42 }}
                />
              )}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth={on ? 2.1 : 1.7} strokeLinecap="round" strokeLinejoin="round" className="relative transition-colors" aria-hidden>
                <path d={t.d} />
                <path d={t.d2} />
              </svg>
              <span className="relative text-[10px] font-bold tracking-[0.02em] transition-colors" style={{ color: ink }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
