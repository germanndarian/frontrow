import type { FieldSituation, Game } from "./types";

/* The rules behind the football field drawn on a live game's sheet — where
   each line goes, which way the offense is driving, what colour each endzone
   can be, and the words underneath. The component only draws what these say.

   Positions arrive from the API as percentages across the playing surface: 0
   at the away team's goal line, 100 at the home team's, the way the graphic
   draws them with the away endzone on the left. No React — unit-tested. */

/** A field is 120 yards by 53⅓. Drawn this small it's squashed, so the yard
    numbers stay legible — which is what the broadcasts do. */
export const FIELD_ASPECT = 3.4;

/** Each endzone is 10 of the 120 yards drawn. */
export const ENDZONE_SHARE = 10 / 120;

/** Where a position on the playing surface sits across a field `width` wide. */
export function fieldX(percent: number, width: number): number {
  const endzone = width * ENDZONE_SHARE;
  return endzone + (width - endzone * 2) * (percent / 100);
}

/** 10–50–10 up both sidelines: each number is the distance to the nearer goal
    line, which is how a field is painted. */
export const YARD_NUMBERS: { at: number; label: number }[] = Array.from({ length: 9 }, (_, i) => {
  const at = (i + 1) * 10;
  return { at, label: Math.min(at, 100 - at) };
});

/** True when the offense is driving towards the home goal line — the high end
    of the field. The home team attacks the away goal, so it drives the other
    way. Null when the feed didn't say who has the ball. */
export function drivesTowardHome(field: FieldSituation): boolean | null {
  return field.homeHasBall == null ? null : !field.homeHasBall;
}

/** The twenty yards the offense is attacking, as a start and end percentage —
    only in the red zone, and only when we know which way it's going. */
export function redZone(field: FieldSituation): [number, number] | null {
  const up = drivesTowardHome(field);
  if (!field.isRedZone || up == null) return null;
  return up ? [80, 100] : [0, 20];
}

/** Which side of the scrimmage line the ball sits: just behind it, on the side
    the offense is driving from. -1 is towards the away end. */
export function ballSide(field: FieldSituation): -1 | 1 {
  return drivesTowardHome(field) === false ? 1 : -1;
}

/** The chains only mean something while there's a ball to measure from. */
export function showChains(field: FieldSituation): boolean {
  return field.ballOn != null && field.firstDown != null;
}

/** "2nd & 9 at TA&M 48". ESPN spells the marker out in some feeds and leaves
    it to the caller in others, so it's only added when it's missing. */
export function fieldHeadline(field: FieldSituation): string | null {
  const down = field.downDistanceText?.trim();
  if (!down) return null;
  const marker = field.possessionText?.trim();
  if (!marker || / at /i.test(down)) return down;
  return `${down} at ${marker}`;
}

/** "Last play: 9:32 - 3rd · M.Reed rush middle…". College feeds open with the
    clock in brackets and the NFL's don't, so the game clock goes in front only
    when it's missing. */
export function lastPlayLine(game: Game): string | null {
  const text = game.lastPlay?.trim();
  if (!text) return null;
  if (text.startsWith("(")) return `Last play: ${text}`;
  const clock = game.period?.trim();
  return clock ? `Last play: ${clock} · ${text}` : `Last play: ${text}`;
}

/* ── Endzone colours ───────────────────────────────────────────────────── */

/** WCAG's floor for large text. An abbreviation this size is large text. */
const MIN_CONTRAST = 3;

/** An endzone in the team's colour, labelled in white or ink — whichever
    reads. Null when the colour can't carry either, and the drawing falls back
    to the app's own surface: a washed-out abbreviation is worse than a neutral
    endzone. In practice every real colour clears 3:1 against one of the two, so
    that's a colour the feed sent that we can't read. */
export function endzoneStyle(hex: string): { fill: string; label: string } | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const lum = luminance(rgb);
  const onWhite = contrast(lum, 1);
  const onInk = contrast(lum, INK_LUMINANCE);
  if (Math.max(onWhite, onInk) < MIN_CONTRAST) return null;
  return { fill: `#${hex.replace("#", "").toLowerCase()}`, label: onWhite >= onInk ? "#ffffff" : INK };
}

const INK = "#131313";
const INK_LUMINANCE = luminance([0x13 / 255, 0x13 / 255, 0x13 / 255]);

function parseHex(hex: string): [number, number, number] | null {
  const s = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  const v = parseInt(s, 16);
  return [((v >> 16) & 0xff) / 255, ((v >> 8) & 0xff) / 255, (v & 0xff) / 255];
}

function luminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: number, b: number): number {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** What a screen reader hears instead of the drawing. */
export function fieldSummary(game: Game, field: FieldSituation): string {
  const said = [fieldHeadline(field), lastPlayLine(game)].filter(Boolean).join(". ");
  return said || "Field position";
}
