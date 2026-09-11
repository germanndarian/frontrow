"use client";

export type TabKey = "scores" | "teams" | "players" | "standings" | "settings";

/* Each tab's glyph is two strokes from the design: a scoreboard, a shield
   with a check, a person, a table grid, a gear. The active tab draws them a
   touch heavier and in the accent colour. */
export const TABS: { key: TabKey; label: string; title: string; d: string; d2: string }[] = [
  { key: "scores", label: "Scores", title: "Live & Upcoming", d: "M4 5.5h16v10.5H4z", d2: "M12 16v3 M8.5 19.5h7" },
  { key: "teams", label: "Teams", title: "Your Teams", d: "M12 3.2l7 2.8v5.2c0 4-2.9 6.9-7 8-4.1-1.1-7-4-7-8V6l7-2.8z", d2: "M9.5 11.8l1.9 1.9 3.4-3.7" },
  { key: "players", label: "Players", title: "Your Players", d: "M12 4.2a3.4 3.4 0 110 6.8 3.4 3.4 0 010-6.8z", d2: "M4.8 20c0-3.5 3.1-5.6 7.2-5.6s7.2 2.1 7.2 5.6" },
  { key: "standings", label: "Table", title: "Around the League", d: "M4 5.5h16v13H4z", d2: "M4 10h16 M4 14.2h16 M9.6 5.5v13" },
  { key: "settings", label: "Settings", title: "Settings", d: "M12 9.4a2.6 2.6 0 110 5.2 2.6 2.6 0 010-5.2z", d2: "M12 3.4v2.6 M12 18v2.6 M4.6 7.7l2.2 1.3 M17.2 15l2.2 1.3 M4.6 16.3l2.2-1.3 M17.2 9l2.2-1.3" },
];

/** Bottom tab bar: an accent indicator, the glyph, the label — cleared of
    the home indicator by the safe-area inset. */
export function TabBar({ tab, onTab }: { tab: TabKey; onTab: (t: TabKey) => void }) {
  return (
    <nav
      className="flex flex-none border-t border-line/90 bg-surface/86 px-2.5 pt-2 backdrop-blur-[20px]"
      style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
      aria-label="Sections"
    >
      {TABS.map((t) => {
        const on = tab === t.key;
        const ink = on ? "var(--color-primary)" : "var(--color-faint)";
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onTab(t.key)}
            aria-current={on ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-1 px-0.5 py-[5px]"
          >
            <span className="h-[3px] w-[22px] rounded-full transition-colors" style={{ background: on ? "var(--color-primary)" : "transparent" }} />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth={on ? 2.1 : 1.7} strokeLinecap="round" strokeLinejoin="round" className="mt-px transition-colors" aria-hidden>
              <path d={t.d} />
              <path d={t.d2} />
            </svg>
            <span className="text-[10.5px] font-bold tracking-[0.02em] transition-colors" style={{ color: ink }}>
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
