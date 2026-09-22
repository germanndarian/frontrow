"use client";

import { motion } from "motion/react";
import { useMotionPref } from "@/lib/motion-pref";

/** A check that draws itself: the ring sweeps round, then the tick is stroked
    on and the whole mark settles — the way a native "done" builds up rather
    than popping in. With motion reduced it's simply there. */
export function DrawnCheck({ size = 56 }: { size?: number }) {
  const reduce = useMotionPref();
  const from = <T,>(value: T) => (reduce ? false : value);

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      role="img"
      aria-label="Setup complete"
      initial={from({ scale: 0.82 })}
      animate={{ scale: 1 }}
      transition={{ type: "spring", duration: 0.45, bounce: 0.35, delay: 0.24 }}
    >
      <circle cx="28" cy="28" r="28" fill="var(--color-primary)" fillOpacity={0.2} />
      <motion.circle
        cx="28"
        cy="28"
        r="26.5"
        fill="none"
        stroke="var(--color-primary)"
        strokeOpacity={0.75}
        strokeWidth={3}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
        initial={from({ pathLength: 0 })}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />
      <motion.path
        d="M17.5 29 25 36.5 39 21.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={from({ pathLength: 0 })}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.38, ease: "easeOut", delay: 0.22 }}
      />
    </motion.svg>
  );
}
