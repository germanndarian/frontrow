"use client";

import { useState } from "react";
import { usePreferences } from "@/lib/store";
import { useTeamSlate } from "@/lib/queries";
import { useCurrentUser } from "@/lib/auth";
import type { FollowedPlayer, FollowedTeam } from "@/lib/types";
import { StaleNotice } from "@/components/dashboard/StaleNotice";
import { TabBar, TABS, type TabKey } from "./TabBar";
import { ScoresTab } from "./ScoresTab";
import { TeamsTab, type TeamAction } from "./TeamsTab";
import { PlayersTab } from "./PlayersTab";
import { TableTab } from "./TableTab";
import { SettingsTab } from "./SettingsTab";
import { BracketSheet, PlayerSheet, ScheduleSheet } from "./sheets";

/* The signed-in iOS app: a header with today's date, the tab's title and the
   live pill; the active tab's content; the bottom tab bar; and whichever
   sheet is open. Tabs are local state — switching is instant and there is no
   route change, which is what makes it feel like an app rather than a site. */

type SheetState = { kind: "schedule" | "bracket"; team: FollowedTeam } | { kind: "player"; player: FollowedPlayer } | null;

function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }).toUpperCase();
}

export function MobileShell({ onEditFollows }: { onEditFollows: () => void }) {
  const [tab, setTab] = useState<TabKey>("scores");
  const [sheet, setSheet] = useState<SheetState>(null);
  const teams = usePreferences((s) => s.teams);
  const { liveCount } = useTeamSlate(teams);
  const profile = useCurrentUser();
  const title = TABS.find((t) => t.key === tab)?.title ?? "";

  function pick(t: TabKey) {
    setTab(t);
    setSheet(null);
  }
  const onTeamAction = (a: TeamAction) => setSheet({ kind: a.kind, team: a.team });

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="z-10 flex-none border-b border-line/70 bg-bg/86 px-[18px] pb-3 backdrop-blur-[18px]" style={{ paddingTop: "max(14px, calc(env(safe-area-inset-top) + 6px))" }}>
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
            <button type="button" onClick={() => pick("settings")} aria-label="Settings" className="grid h-[38px] w-[38px] place-items-center rounded-full border border-line/80 bg-surface text-[17px]">
              {profile?.avatarEmoji ?? "⚾️"}
            </button>
          </div>
        </div>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto">
        <div className="px-[18px] pt-3 empty:hidden"><StaleNotice /></div>
        {tab === "scores" && <ScoresTab />}
        {tab === "teams" && <TeamsTab onAction={onTeamAction} />}
        {tab === "players" && <PlayersTab onOpen={(p) => setSheet({ kind: "player", player: p })} />}
        {tab === "standings" && <TableTab />}
        {tab === "settings" && <SettingsTab onEditFollows={onEditFollows} />}
      </div>

      <TabBar tab={tab} onTab={pick} />

      {sheet?.kind === "schedule" && <ScheduleSheet team={sheet.team} onClose={() => setSheet(null)} />}
      {sheet?.kind === "bracket" && <BracketSheet team={sheet.team} onClose={() => setSheet(null)} />}
      {sheet?.kind === "player" && <PlayerSheet player={sheet.player} onClose={() => setSheet(null)} />}
    </div>
  );
}
