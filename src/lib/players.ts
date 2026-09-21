import type { FollowedPlayer, FollowedTeam, Player, PlayerBio } from "./types";

/* How the dashboard lays out the players you follow: grouped under the team
   they play for, and a player's profile as rows. The same rules as the iPhone
   app's Players tab and player sheet. No React — unit-tested. */

export interface PlayerSection {
  key: string;
  title: string;
  abbr: string;
  color: string;
  players: FollowedPlayer[];
}

/** The colour of a group whose team you don't follow. */
const NEUTRAL = "#8c8c86";

/** Players under their team, in the order your teams are listed — a name is
    easier to find next to its badge than in one long column. A player whose
    team you don't follow still needs a home: a group of its own, after yours.
    Keyed by league as well, since two leagues can share an abbreviation. */
export function playerSections(players: FollowedPlayer[], teams: FollowedTeam[]): PlayerSection[] {
  const byTeam = new Map<string, FollowedPlayer[]>();
  for (const player of players) {
    const key = `${player.league}:${player.teamAbbr}`;
    byTeam.set(key, [...(byTeam.get(key) ?? []), player]);
  }

  const sections: PlayerSection[] = [];
  for (const team of teams) {
    const key = `${team.league}:${team.abbreviation}`;
    const list = byTeam.get(key);
    if (!list) continue;
    sections.push({ key, title: team.displayName, abbr: team.abbreviation, color: team.color, players: list });
    byTeam.delete(key);
  }
  for (const key of [...byTeam.keys()].sort()) {
    const list = byTeam.get(key)!;
    sections.push({ key, title: list[0].teamAbbr, abbr: list[0].teamAbbr, color: NEUTRAL, players: list });
  }
  return sections;
}

/** "NYY · RF · #99" — whatever of the three the feed has. */
export function playerSubtitle(player: Pick<Player, "teamAbbr" | "position" | "jersey">): string {
  const jersey = player.jersey && player.jersey !== "—" ? `#${player.jersey}` : "";
  return [player.teamAbbr, player.position, jersey].filter(Boolean).join(" · ");
}

/** The profile under a player's numbers, in reading order, leaving out
    whatever ESPN doesn't have — which depends on the sport and the career. */
export function bioRows(bio: PlayerBio | undefined): [label: string, value: string][] {
  if (!bio) return [];
  const rows: [string, string | number | undefined][] = [
    ["Status", bio.status],
    ["Height", bio.height],
    ["Weight", bio.weight],
    ["Age", bio.age],
    ["Born", bio.birthplace],
    ["Bats/Throws", bio.batsThrows],
    ["Experience", bio.experience],
    ["College", bio.college],
    ["Draft", bio.draft],
  ];
  return rows
    .filter(([, value]) => value != null && String(value).trim() !== "")
    .map(([label, value]) => [label, String(value)]);
}
