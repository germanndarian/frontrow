"use client";

export type TabKey = "scores" | "teams" | "players" | "standings" | "settings";

export const TABS: { key: TabKey; label: string; title: string }[] = [
  { key: "scores", label: "Scores", title: "Live & Upcoming" },
  { key: "teams", label: "Teams", title: "Your Teams" },
  { key: "players", label: "Players", title: "Your Players" },
  { key: "standings", label: "Table", title: "Around the League" },
  { key: "settings", label: "Settings", title: "Settings" },
];

/** Bottom tab bar: an accent indicator above each label, cleared of the home
    indicator by the safe-area inset. */
export function TabBar({ tab, onTab }: { tab: TabKey; onTab: (t: TabKey) => void }) {
  return (
    <nav
      className="flex flex-none border-t border-line/90 bg-surface/86 px-2.5 pt-2 backdrop-blur-[20px]"
      style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
      aria-label="Sections"
    >
      {TABS.map((t) => {
        const on = tab === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onTab(t.key)}
            aria-current={on ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-[5px] px-0.5 py-[7px]"
          >
            <span className="h-[3px] w-[22px] rounded-full transition-colors" style={{ background: on ? "var(--color-primary)" : "transparent" }} />
            <span className="text-[10.5px] font-bold tracking-[0.02em]" style={{ color: on ? "var(--color-primary)" : "var(--color-faint)" }}>
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
