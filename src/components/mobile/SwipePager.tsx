"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, motion, useDragControls, useMotionValue, type PanInfo } from "motion/react";
import { useMotionPref } from "@/lib/motion-pref";

/* Horizontal pager that tracks the finger: the current page slides with the
   drag and settles into the neighbour on release, like iOS page controls.
   Used for the app's tabs and for onboarding's steps.

   - Commits on release. The page change happens the instant the finger
     lifts, so the tab bar and title react immediately; the slide then
     finishes from wherever the finger left it, carrying its velocity.
   - The position reset that keeps that slide continuous runs in a layout
     effect, before paint — a plain effect would flash one frame at the old
     offset with the new pages, which reads as a jump.
   - Touch only. A mouse never drags, so desktop keeps its click-driven flow.
   - Axis-locked, and horizontal touchmoves are cancelled once intent is
     clear, so the browser can't claim the gesture for scrolling while
     vertical scrolling inside pages stays native.
   - Rows that scroll sideways (chips, the bracket) opt out with
     `data-hscroll`. Neighbours stay mounted so the slide never shows a
     blank page. */

// Critically damped: settles in ~250ms with no overshoot.
const SPRING = { type: "spring", stiffness: 520, damping: 46, mass: 1 } as const;

/** Which way to page for a release at `offset` px / `velocity` px/s. */
export function decideSwipe(offset: number, velocity: number, width: number): -1 | 0 | 1 {
  const threshold = Math.max(56, width * 0.22);
  if (offset <= -threshold || velocity <= -500) return 1;
  if (offset >= threshold || velocity >= 500) return -1;
  return 0;
}

export function SwipePager({
  index,
  count,
  canSwipe,
  onSwipe,
  render,
  className,
}: {
  index: number;
  count: number;
  /** May the user page in this direction right now? */
  canSwipe: (dir: -1 | 1) => boolean;
  onSwipe: (dir: -1 | 1) => void;
  render: (i: number) => React.ReactNode;
  className?: string;
}) {
  const reduce = useMotionPref();
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const x = useMotionValue(0);
  const controls = useDragControls();
  const prev = useRef(index);
  // Where the finger left the track, and how fast, when a swipe commits.
  const handoff = useRef<{ x: number; v: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Cancel horizontal touchmoves once intent is clear (see header comment).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let sx = 0;
    let sy = 0;
    let intent: "none" | "x" | "y" = "none";
    const start = (e: TouchEvent) => {
      const t = e.touches[0];
      sx = t.clientX;
      sy = t.clientY;
      intent = (e.target as HTMLElement).closest("[data-hscroll]") ? "y" : "none";
    };
    const move = (e: TouchEvent) => {
      if (intent === "none") {
        const t = e.touches[0];
        const dx = Math.abs(t.clientX - sx);
        const dy = Math.abs(t.clientY - sy);
        if (dx > 6 || dy > 6) intent = dx > dy ? "x" : "y";
      }
      if (intent === "x" && e.cancelable) e.preventDefault();
    };
    const end = () => {
      intent = "none";
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
  }, []);

  // The page changed — from a swipe (handoff set) or a button (not set).
  // The track is now centred on the new page, so shift x by one page width
  // to keep the picture exactly where it was, then settle to 0. Layout
  // effect: this must land before the browser paints the re-ordered pages.
  useLayoutEffect(() => {
    if (prev.current === index) return;
    const dir = index > prev.current ? 1 : -1;
    prev.current = index;
    const h = handoff.current;
    handoff.current = null;
    x.set((h?.x ?? 0) + dir * width);
    animate(x, 0, reduce ? { duration: 0 } : { ...SPRING, velocity: h?.v ?? 0 });
  }, [index, width, reduce, x]);

  const canPrev = index > 0 && canSwipe(-1);
  const canNext = index < count - 1 && canSwipe(1);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== "touch") return;
    if ((e.target as HTMLElement).closest("[data-hscroll]")) return;
    controls.start(e);
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    const dir = decideSwipe(info.offset.x, info.velocity.x, width);
    // Returning on the zero case first is what lets TypeScript narrow `dir`.
    if (dir === 0 || !(dir === 1 ? canNext : canPrev)) {
      animate(x, 0, reduce ? { duration: 0 } : { ...SPRING, velocity: info.velocity.x });
      return;
    }
    handoff.current = { x: x.get(), v: info.velocity.x };
    onSwipe(dir);
  }

  return (
    <div ref={ref} className={`relative overflow-hidden ${className ?? ""}`} onPointerDown={onPointerDown}>
      <motion.div
        className="absolute inset-y-0 flex"
        style={{ x, width: "300%", left: "-100%", touchAction: "pan-y" }}
        drag="x"
        dragListener={false}
        dragControls={controls}
        dragDirectionLock
        dragMomentum={false}
        dragElastic={0.12}
        dragConstraints={{ left: canNext ? -width : 0, right: canPrev ? width : 0 }}
        onDragEnd={onDragEnd}
      >
        {[index - 1, index, index + 1].map((i) => (
          <div key={i} className="h-full w-1/3">
            {i >= 0 && i < count ? render(i) : null}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
