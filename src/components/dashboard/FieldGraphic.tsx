"use client";

import { motion } from "motion/react";
import type { FieldSituation, Game, GameSide } from "@/lib/types";
import { useMotionPref } from "@/lib/motion-pref";
import {
  ENDZONE_SHARE,
  FIELD_ASPECT,
  YARD_NUMBERS,
  ballSide,
  endzoneStyle,
  fieldHeadline,
  fieldSummary,
  fieldX,
  lastPlayLine,
  redZone,
  showChains,
} from "@/lib/field-graphic";

/* Where the ball is, drawn the way a broadcast draws it: the away team's
   endzone on the left and the home team's on the right, the line of scrimmage
   in blue and the chains in yellow, with the down and distance underneath.
   Every position comes from the scoreboard the page already refreshes, so the
   lines slide across when it does and never move on their own. */

const W = 340;
const H = W / FIELD_ASPECT;

/* The graphic's own palette: chalk belongs to this drawing, not to the app's
   surfaces. The turf is a theme token so it can go darker at night. */
const SCRIMMAGE = "#2f6bff";
const CHAINS = "#f7c948";
const CHALK = "#ffffff";

export function FieldGraphic({ game, field }: { game: Game; field: FieldSituation }) {
  const reduce = useMotionPref();
  const slide = reduce ? { duration: 0 } : { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const };
  const x = (percent: number) => fieldX(percent, W);
  const endzone = W * ENDZONE_SHARE;
  const zone = redZone(field);
  const headline = fieldHeadline(field);
  const lastPlay = lastPlayLine(game);

  return (
    <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
      <div className="p-3.5">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full rounded-[10px]"
          role="img"
          aria-label={fieldSummary(game, field)}
        >
          <rect width={W} height={H} fill="var(--color-turf)" />

          {zone && (
            <rect x={x(zone[0])} width={x(zone[1]) - x(zone[0])} height={H} fill={CHALK} fillOpacity={0.13} />
          )}

          {/* Ten-yard lines, the goal lines picked out. */}
          {Array.from({ length: 11 }, (_, i) => {
            const goal = i === 0 || i === 10;
            return (
              <line
                key={i}
                x1={x(i * 10)}
                x2={x(i * 10)}
                y1={0}
                y2={H}
                stroke={CHALK}
                strokeOpacity={goal ? 0.85 : 0.3}
                strokeWidth={goal ? 1.5 : 1}
              />
            );
          })}

          {/* The two inner rows of hash marks, every five yards. */}
          {Array.from({ length: 19 }, (_, i) => (i + 1) * 5).flatMap((yard) =>
            [0.38, 0.62].map((row) => (
              <line
                key={`${yard}-${row}`}
                x1={x(yard)}
                x2={x(yard)}
                y1={H * (row - 0.035)}
                y2={H * (row + 0.035)}
                stroke={CHALK}
                strokeOpacity={0.22}
              />
            )),
          )}

          {YARD_NUMBERS.flatMap((n) =>
            [0.21, 0.79].map((row) => (
              <text
                key={`${n.at}-${row}`}
                x={x(n.at)}
                y={H * row}
                fill={CHALK}
                fillOpacity={0.75}
                fontSize={H * 0.17}
                fontWeight={600}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {n.label}
              </text>
            )),
          )}

          {showChains(field) && (
            <Chalk at={x(field.firstDown!)} color={CHAINS} transition={slide} />
          )}
          {field.ballOn != null && <Chalk at={x(field.ballOn)} color={SCRIMMAGE} transition={slide} />}
          {field.ballOn != null && field.homeHasBall != null && (
            <motion.ellipse
              initial={false}
              animate={{ cx: x(field.ballOn) + ballSide(field) * 7 }}
              transition={slide}
              cy={H / 2}
              rx={6}
              ry={3.6}
              fill={CHALK}
            />
          )}

          <Endzone side={game.away} x={0} width={endzone} rotate={-90} />
          <Endzone side={game.home} x={W - endzone} width={endzone} rotate={90} />
        </svg>
      </div>

      {(headline || lastPlay) && (
        <div className="border-t border-line-soft px-4 py-3">
          {headline && <p className="text-[15px] font-bold text-ink">{headline}</p>}
          {lastPlay && <p className="mt-1 text-[12.5px] leading-snug text-muted">{lastPlay}</p>}
        </div>
      )}
    </div>
  );
}

/** A line across the field, sliding to its new place when the refresh moves it. */
function Chalk({
  at,
  color,
  transition,
}: {
  at: number;
  color: string;
  transition: object;
}) {
  return (
    <motion.line
      initial={false}
      animate={{ x1: at, x2: at }}
      transition={transition}
      y1={0}
      y2={H}
      stroke={color}
      strokeWidth={2}
    />
  );
}

/** An endzone in the team's colour with its abbreviation, or the app's own
    surface when the colour won't carry a readable label. */
function Endzone({ side, x, width, rotate }: { side: GameSide; x: number; width: number; rotate: number }) {
  const style = endzoneStyle(side.color);
  const cx = x + width / 2;
  const cy = H / 2;
  return (
    <g>
      <rect x={x} width={width} height={H} fill={style?.fill ?? "var(--color-surface-2)"} />
      <text
        x={cx}
        y={cy}
        transform={`rotate(${rotate} ${cx} ${cy})`}
        fill={style?.label ?? "var(--color-ink)"}
        fontSize={Math.min(width * 0.55, 15)}
        fontWeight={800}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {side.abbreviation}
      </text>
    </g>
  );
}
