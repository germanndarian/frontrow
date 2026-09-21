"use client";

import type { FollowedPlayer, FollowedTeam } from "@/lib/types";
import { LEAGUES } from "@/lib/leagues";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { Headshot } from "@/components/ui/Headshot";

/* One followed team or player, with the button that stops following it — the
   rows of Settings' "What you follow" panel and of its full list. */

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Unfollow ${label}`}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-faint transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-loss/12 hover:text-loss active:scale-90"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );
}

export function TeamRow({ team, onRemove }: { team: FollowedTeam; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-bg-2/40">
      <TeamLogo src={team.logo} name={team.displayName} abbr={team.abbreviation} color={team.color} size={30} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold text-ink">{team.displayName}</div>
        <div className="text-[12px] text-faint">{LEAGUES[team.league].name}</div>
      </div>
      <RemoveButton onClick={onRemove} label={team.displayName} />
    </div>
  );
}

export function PlayerRow({ player, onRemove }: { player: FollowedPlayer; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-bg-2/40">
      <Headshot src={player.headshot} name={player.fullName} size={34} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold text-ink">{player.fullName}</div>
        <div className="text-[12px] text-faint">
          {[player.teamAbbr, player.position, LEAGUES[player.league].name].filter(Boolean).join(" · ")}
        </div>
      </div>
      <RemoveButton onClick={onRemove} label={player.fullName} />
    </div>
  );
}
