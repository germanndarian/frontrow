"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { usePreferences } from "@/lib/store";
import { useTeamSlate } from "@/lib/queries";
import { useCurrentUser } from "@/lib/auth";
import { now } from "@/lib/clock";
import type { FollowedPlayer, FollowedTeam } from "@/lib/types";
import { StaleNotice } from "@/components/dashboard/StaleNotice";
import { TabBar, TABS, type TabKey } from "./TabBar";
import { SwipePager } from "./SwipePager";
import { ScoresTab } from "./ScoresTab";
import { TeamsTab, type TeamAction } from "./TeamsTab";
import { PlayersTab } from "./PlayersTab";
import { TableTab } from "./TableTab";
import { SettingsTab } from "./SettingsTab";
import { BracketSheet, PlayerSheet, ScheduleSheet } from "./sheets";

/* The signed-in iOS app: a glass header with today's date, the tab's title
   and the live pill; the tabs in a pager you can swipe between; the floating
   tab bar; and whichever sheet is open. Tabs are local state — switching is
   instant and there is no route change. */

type SheetState = { kind: "schedule" | "bracket"; team: FollowedTeam } | { kind: "player"; player: FollowedPlayer } | null;

function todayLabel() {
  return new Date(now()).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }).toUpperCase();
}

export function MobileShell({ onEditFollows }: { onEditFollows: () => void }) {
  const [tab, setTab] = useState<TabKey>("scores");
  const [sheet, setSheet] = useState<SheetState>(null);
  const teams = usePreferences((s) => s.teams);
  const { liveCount } = useTeamSlate(teams);
  const profile = useCurrentUser();
  const index = TABS.findIndex((t) => t.key === tab);
  const title = TABS[index]?.title ?? "";

  function pick(t: TabKey) {
    setTab(t);
    setSheet(null);
  }
  const onTeamAction = (a: TeamAction) => setSheet({ kind: a.kind, team: a.team });

  function page(key: TabKey) {
    switch (key) {
      case "scores":
        return <ScoresTab />;
      case "teams":
        return <TeamsTab onAction={onTeamAction} />;
      case "players":
        return <PlayersTab onOpen={(p) => setSheet({ kind: "player", player: p })} />;
      case "standings":
        return <TableTab />;
      case "settings":
        return <SettingsTab onEditFollows={onEditFollows} />;
    }
  }

  return (
    <div className="relative flex h-dvh flex-col">
      <header className="glass-bar z-10 flex-none px-[18px] pb-3" style={{ paddingTop: "max(14px, calc(env(safe-area-inset-top) + 6px))" }}>
        <div className="flex items-center justify-between gap-2.5">
          <div className="min-w-0">
            <div className="font-mono text-[10.5px] font-bold tracking-[0.14em] text-faint">{todayLabel()}</div>
            <h1 className="m-0 mt-0.5 truncate font-display text-[23px] font-black leading-[1.1] tracking-[-0.03em] text-ink">{title}</h1>
          </div>
          <div className="flex flex-none items-center gap-2">
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-live/12 px-2.5 py-[5px] text-[11px] font-bold tracking-[0.08em] text-live">
                <span className="live-dot" />
                {liveCount} LIVE
              </span>
            )}
            <button type="button" onClick={() => pick("settings")} aria-label="Settings" className="glass grid h-[38px] w-[38px] place-items-center rounded-full text-[17px] active:scale-95">
              {profile?.avatarEmoji ?? "⚾️"}
            </button>
          </div>
        </div>
      </header>

      <SwipePager
        className="min-h-0 flex-1"
        index={index}
        count={TABS.length}
        canSwipe={() => true}
        onSwipe={(dir) => pick(TABS[index + dir].key)}
        render={(i) => (
          <div className="no-scrollbar h-full overflow-y-auto" style={{ paddingBottom: "calc(92px + env(safe-area-inset-bottom))" }}>
            <div className="px-[18px] pt-3 empty:hidden"><StaleNotice /></div>
            {page(TABS[i].key)}
          </div>
        )}
      />

      <TabBar tab={tab} onTab={pick} />

      <AnimatePresence>
        {sheet?.kind === "schedule" && <ScheduleSheet key={`s-${sheet.team.teamId}`} team={sheet.team} onClose={() => setSheet(null)} />}
        {sheet?.kind === "bracket" && <BracketSheet key={`b-${sheet.team.teamId}`} team={sheet.team} onClose={() => setSheet(null)} />}
        {sheet?.kind === "player" && <PlayerSheet key={`p-${sheet.player.id}`} player={sheet.player} onClose={() => setSheet(null)} />}
      </AnimatePresence>
    </div>
  );
}
