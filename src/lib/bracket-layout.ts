import type { PlayoffBracket, PlayoffMatchup } from "./types";

/* Pure geometry for the bracket. Given a bracket (and optionally the followed
   team), returns absolute card positions and the SVG connector paths — the
   structured, rounded-corner curves with gaps that we locked in design. Kept
   free of React so it's unit-testable. */

export const CARD_W = 172;
export const CARD_H = 66;
const COL_W = 220; // card + horizontal gap between rounds
const ROW_H = 88; // vertical pitch of first-round matchups
const TOP = 30; // room for the round label band
const GAP = 12; // gap between a connector end and a card
const FAN = 9; // vertical separation of the two feeder lines at the target
const R = 10; // connector corner radius

export interface BracketCard {
  matchup: PlayoffMatchup;
  x: number; // left
  y: number; // top
  onPath: boolean;
}

export interface BracketConnector {
  d: string;
  onPath: boolean;
}

export interface BracketLayout {
  width: number;
  height: number;
  rounds: { name: string; x: number; live: boolean }[];
  cards: BracketCard[];
  connectors: BracketConnector[];
}

function hasTeam(m: PlayoffMatchup, teamId?: string): boolean {
  return !!teamId && (m.home.teamId === teamId || m.away.teamId === teamId);
}

function elbow(sx: number, sy: number, ex: number, ey: number): string {
  const xmid = (sx + ex) / 2;
  const dir = ey >= sy ? 1 : -1;
  const r = Math.min(R, Math.abs(ey - sy) / 2, (ex - sx) / 2);
  if (r < 1) return `M${sx} ${sy} H${ex}`;
  return (
    `M${sx} ${sy} H${xmid - r} Q${xmid} ${sy} ${xmid} ${sy + dir * r} ` +
    `V${ey - dir * r} Q${xmid} ${ey} ${xmid + r} ${ey} H${ex}`
  );
}

export function layoutBracket(
  bracket: PlayoffBracket,
  followedTeamId?: string,
): BracketLayout {
  const rounds = bracket.rounds;
  const feedersOf = (m: PlayoffMatchup): PlayoffMatchup[] =>
    m.round > 0
      ? (rounds[m.round - 1]?.matchups.filter((f) => f.nextMatchupId === m.id) ?? [])
      : [];

  // Order the first-round (leaf) matchups by an in-order walk down from the
  // final, so feeders of the same matchup sit adjacent and lines don't cross.
  const leafOrder: string[] = [];
  const seen = new Set<string>();
  const walk = (m: PlayoffMatchup) => {
    const fs = feedersOf(m);
    if (fs.length === 0) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        leafOrder.push(m.id);
      }
      return;
    }
    fs.forEach(walk);
  };
  (rounds[rounds.length - 1]?.matchups ?? []).forEach(walk);
  // Any first-round matchup not reached (incomplete data) still gets a slot.
  rounds[0]?.matchups.forEach((m) => {
    if (!seen.has(m.id)) {
      seen.add(m.id);
      leafOrder.push(m.id);
    }
  });

  // Center-Y per matchup: leaves evenly spaced, internal nodes centered on feeders.
  const cy = new Map<string, number>();
  leafOrder.forEach((id, i) => cy.set(id, TOP + i * ROW_H + ROW_H / 2));
  for (let r = 1; r < rounds.length; r++) {
    rounds[r].matchups.forEach((m, i) => {
      const ys = feedersOf(m)
        .map((f) => cy.get(f.id))
        .filter((v): v is number => v != null);
      cy.set(
        m.id,
        ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : TOP + i * ROW_H + ROW_H / 2,
      );
    });
  }

  const cards: BracketCard[] = [];
  const connectors: BracketConnector[] = [];

  for (const round of rounds) {
    for (const m of round.matchups) {
      const x = m.round * COL_W;
      const y = (cy.get(m.id) ?? TOP) - CARD_H / 2;
      const onPath = hasTeam(m, followedTeamId);
      cards.push({ matchup: m, x, y, onPath });

      if (!m.nextMatchupId) continue;
      const next = rounds[m.round + 1]?.matchups.find((n) => n.id === m.nextMatchupId);
      if (!next) continue;

      // Separate the two feeder lines where they meet the next card.
      const sibs = feedersOf(next);
      const myY = cy.get(m.id) ?? 0;
      const upper = sibs.length > 1 && myY <= Math.min(...sibs.map((f) => cy.get(f.id) ?? 0));
      const off = sibs.length > 1 ? (upper ? -FAN : FAN) : 0;

      const sx = m.round * COL_W + CARD_W + GAP;
      const sy = myY;
      const ex = next.round * COL_W - GAP;
      const ey = (cy.get(next.id) ?? 0) + off;
      connectors.push({
        d: elbow(sx, sy, ex, ey),
        onPath: onPath && hasTeam(next, followedTeamId),
      });
    }
  }

  const width = (rounds.length - 1) * COL_W + CARD_W;
  const height = leafOrder.length * ROW_H + TOP + 12;
  const roundLabels = rounds.map((r, i) => ({
    name: r.name,
    x: i * COL_W,
    live: r.matchups.some((m) => m.state === "in"),
  }));

  return { width, height, rounds: roundLabels, cards, connectors };
}
