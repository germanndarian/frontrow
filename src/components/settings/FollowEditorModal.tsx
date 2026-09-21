"use client";

import { useState } from "react";
import { usePreferences } from "@/lib/store";
import { followSummary } from "@/lib/follows";
import { offersLeagueChoice } from "@/lib/leagues";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { SheetFrame } from "@/components/ui/SheetFrame";
import { EmptyState } from "@/components/ui/States";
import { LeaguePicker, SportPicker } from "@/components/setup/SportLeaguePickers";
import { TeamPicker } from "@/components/setup/TeamPicker";
import { PlayerPicker } from "@/components/setup/PlayerPicker";

/* Changing what you follow after setup, with the pickers setup used, behind one
   Edit button: sports, leagues, teams and players are the same question. Each
   tap saves, as it always has. The Leagues tab only appears when a sport you
   follow has more than one league — the same rule setup uses. */

type Tab = "sports" | "leagues" | "teams" | "players";

const LABELS: Record<Tab, string> = { sports: "Sports", leagues: "Leagues", teams: "Teams", players: "Players" };

export function FollowEditorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="follow-editor-title" className="max-w-2xl">
      {/* Mounted only while open, so each visit starts on Sports. */}
      {open && <Editor onClose={onClose} />}
    </Modal>
  );
}

function Editor({ onClose }: { onClose: () => void }) {
  const prefs = usePreferences();
  const [chosen, setChosen] = useState<Tab>("sports");
  const tabs: Tab[] = ["sports", ...(offersLeagueChoice(prefs.sports) ? (["leagues"] as const) : []), "teams", "players"];
  // Dropping football takes the Leagues tab away; land somewhere that exists.
  const tab = tabs.includes(chosen) ? chosen : "sports";

  return (
    <SheetFrame
      titleId="follow-editor-title"
      title="Edit follows"
      subtitle={followSummary(prefs)}
      onClose={onClose}
      closeLabel="Done editing"
      bodyClassName="p-4"
    >
      <div role="tablist" aria-label="What to edit" className="mb-4 flex gap-1 rounded-full border border-line/70 bg-bg-2/50 p-1">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={t === tab}
            onClick={() => setChosen(t)}
            className={cn(
              "flex-1 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-[background-color,color] duration-150",
              t === tab ? "bg-primary text-primary-ink" : "text-muted hover:text-ink",
            )}
          >
            {LABELS[t]}
          </button>
        ))}
      </div>

      {tab === "sports" && <SportPicker selected={prefs.sports} onToggle={prefs.toggleSport} />}
      {tab === "leagues" && <LeaguePicker sports={prefs.sports} selected={prefs.leagues} onToggle={prefs.toggleLeague} />}
      {tab === "teams" &&
        (prefs.leagues.length > 0 ? (
          <TeamPicker leagues={prefs.leagues} selected={prefs.teams} onToggle={prefs.toggleTeam} />
        ) : (
          <EmptyState title="Pick a sport first" body="Choose a sport under Sports, then come back to add its teams." />
        ))}
      {tab === "players" &&
        (prefs.teams.length > 0 ? (
          <PlayerPicker teams={prefs.teams} selected={prefs.players} onToggle={prefs.togglePlayer} />
        ) : (
          <EmptyState title="Follow a team first" body="Players are picked from the rosters of teams you follow." />
        ))}
    </SheetFrame>
  );
}
