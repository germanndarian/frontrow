"use client";

import { usePreferences } from "@/lib/store";
import { followSummary } from "@/lib/follows";
import { Modal } from "@/components/ui/Modal";
import { SheetFrame } from "@/components/ui/SheetFrame";
import { PlayerRow, TeamRow } from "./FollowRows";

/* Everything you follow, when the panel's preview isn't all of it: the teams,
   then the players, with the same button to stop following each. */

export function FollowsListModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const prefs = usePreferences();
  return (
    <Modal open={open} onClose={onClose} labelledBy="follows-list-title">
      <SheetFrame
        titleId="follows-list-title"
        title="What you follow"
        subtitle={followSummary(prefs)}
        onClose={onClose}
        closeLabel="Close list"
        bodyClassName="px-2 pb-3"
      >
        {prefs.teams.length > 0 && (
          <section aria-label="Teams">
            <GroupLabel>Teams</GroupLabel>
            {prefs.teams.map((t) => (
              <TeamRow key={`${t.league}:${t.teamId}`} team={t} onRemove={() => prefs.toggleTeam(t)} />
            ))}
          </section>
        )}
        {prefs.players.length > 0 && (
          <section aria-label="Players">
            <GroupLabel>Players</GroupLabel>
            {prefs.players.map((p) => (
              <PlayerRow key={`${p.league}:${p.id}`} player={p} onRemove={() => prefs.togglePlayer(p)} />
            ))}
          </section>
        )}
      </SheetFrame>
    </Modal>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1.5 pt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">{children}</div>
  );
}
