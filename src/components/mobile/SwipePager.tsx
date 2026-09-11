"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useDragControls, useMotionValue, type PanInfo } from "motion/react";
import { useMotionPref } from "@/lib/motion-pref";

/* Horizontal pager that tracks the finger: the current page slides with the
   drag and settles into the neighbour on release, like iOS page controls.
   Used for the app's tabs and for onboarding's steps.

   - Touch only. A mouse never drags, so desktop keeps its click-driven flow.
   - Axis-locked: a vertical scroll never turns into a page change, and
     `touch-action: pan-y` keeps native scrolling inside pages.
   - Rows that scroll sideways (chips, the bracket) opt out with
     `data-hscroll`; a drag that starts inside one is left alone.
   - Neighbours stay mounted so the slide never shows a blank page. */

const SPRING = { type: "spring", stiffness: 420, damping: 40, mass: 0.9 } as const;

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
  const settling = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Browsers take a touch for native scrolling once it passes the slop
  // threshold — even under touch-action — unless its first horizontal
  // touchmove is cancelled. Decide intent from the touch's own displacement,
  // so vertical scrolls stay native and horizontal drags stay ours.
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

  // A page change from outside (a button) slides too: start with the old page
  // in view and settle onto the new one. Skipped when a drag already did it.
  useEffect(() => {
    if (prev.current === index) return;
    const dir = index > prev.current ? 1 : -1;
    prev.current = index;
    if (settling.current) {
      settling.current = false;
      x.set(0);
      return;
    }
    x.set(dir * width);
    animate(x, 0, reduce ? { duration: 0 } : SPRING);
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
    // Returning on the zero case first is what lets TypeScript narrow `dir`
    // to -1 | 1 for onSwipe below.
    if (dir === 0 || !(dir === 1 ? canNext : canPrev)) {
      animate(x, 0, reduce ? { duration: 0 } : SPRING);
      return;
    }
    settling.current = true;
    animate(x, -dir * width, reduce ? { duration: 0 } : SPRING).then(() => onSwipe(dir));
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
