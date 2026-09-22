"use client";

import { useState } from "react";
import { usePreferences } from "@/lib/store";
import { followPreview, followSummary } from "@/lib/follows";
import { LEAGUES, LEAGUE_ORDER } from "@/lib/leagues";
import { Card } from "@/components/ui/Card";
import { FollowEditorModal } from "./FollowEditorModal";
import { FollowsListModal } from "./FollowsListModal";
import { PlayerRow, TeamRow } from "./FollowRows";

/* What you follow, in one panel: a summary, the leagues, and a preview of the
   teams and players with a way to drop each — three of each, then "View all",
   so the panel stays a readable height however much you follow. One Edit
   button changes all of it, since sports, leagues, teams and players are the
   same question. The iPhone app's Settings panel. */

export function FollowsPanel() {
  const prefs = usePreferences();
  const [editing, setEditing] = useState(false);
  const [listing, setListing] = useState(false);
  const preview = followPreview(prefs);
  const leagues = LEAGUE_ORDER.filter((l) => prefs.leagues.includes(l));

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">{followSummary(prefs)}</div>
          <h2 className="font-display text-[15px] font-bold tracking-tight text-ink">What you follow</h2>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/45 bg-primary/12 px-3.5 py-1.5 text-[12.5px] font-semibold text-primary-bright transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-primary/18 active:scale-[0.96]"
        >
          Edit
        </button>
      </div>

      {leagues.length === 0 ? (
        <p className="px-5 pb-4 text-[13px] text-faint">Nothing followed yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2 px-5 pb-3">
          {leagues.map((l) => (
            <span
              key={l}
              className="inline-flex items-center gap-1.5 rounded-full border border-line/70 bg-bg-2/60 px-2.5 py-1 text-[12px] font-medium text-muted"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary-bright" />
              {LEAGUES[l].fullName}
            </span>
          ))}
        </div>
      )}

      {(preview.teams.length > 0 || preview.players.length > 0) && (
        <div className="border-t border-line-soft/70 px-2 py-1.5">
          {preview.teams.map((t) => (
            <TeamRow key={`${t.league}:${t.teamId}`} team={t} onRemove={() => prefs.toggleTeam(t)} />
          ))}
          {preview.players.map((p) => (
            <PlayerRow key={`${p.league}:${p.id}`} player={p} onRemove={() => prefs.togglePlayer(p)} />
          ))}
        </div>
      )}

      {preview.hidden > 0 && (
        <button
          type="button"
          onClick={() => setListing(true)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-line-soft/70 py-3 text-[13px] font-semibold text-primary-bright transition-colors hover:bg-primary/8"
        >
          View all {preview.total}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="opacity-60">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      )}

      <FollowEditorModal open={editing} onClose={() => setEditing(false)} />
      <FollowsListModal open={listing} onClose={() => setListing(false)} />
    </Card>
  );
}
