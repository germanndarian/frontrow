import type { Preferences } from "./types";

/* The "What you follow" panel in Settings: a summary line, and a preview short
   enough to keep the panel a readable height however much you follow. The same
   rules as the iPhone app's Settings. No React — unit-tested. */

/** How many teams, and how many players, the panel shows before "View all". */
export const PREVIEW = 3;

type Follows = Pick<Preferences, "leagues" | "teams" | "players">;

/** "3 leagues · 4 teams · 2 players", leaving out whatever is empty. */
export function followSummary({ leagues, teams, players }: Follows): string {
  const counts: [number, string][] = [
    [leagues.length, "league"],
    [teams.length, "team"],
    [players.length, "player"],
  ];
  const parts = counts.filter(([n]) => n > 0).map(([n, noun]) => `${n} ${noun}${n === 1 ? "" : "s"}`);
  return parts.length ? parts.join(" · ") : "Nothing yet";
}

/** Three teams and three players, rather than a flat count, so a long list of
    teams can't push the players out of the preview entirely. */
export function followPreview({ teams, players }: Follows) {
  return {
    teams: teams.slice(0, PREVIEW),
    players: players.slice(0, PREVIEW),
    hidden: Math.max(0, teams.length - PREVIEW) + Math.max(0, players.length - PREVIEW),
    total: teams.length + players.length,
  };
}
