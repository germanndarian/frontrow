"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A row that scrolls sideways. An edge fades only when something is hidden past
 * it, so the first and last items at rest keep their borders instead of
 * bleeding into the mask.
 */
export function HScroller({
  children,
  className,
  innerClassName,
  role,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  role?: string;
  label?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const next = { left: scrollLeft > 2, right: scrollLeft < scrollWidth - clientWidth - 2 };
    setFade((prev) => (prev.left === next.left && prev.right === next.right ? prev : next));
  }, []);

  useEffect(() => {
    update();
    // The row changes size with the window, and its content with the data.
    const ro = new ResizeObserver(update);
    if (scroller.current) ro.observe(scroller.current);
    if (content.current) ro.observe(content.current);
    return () => ro.disconnect();
  }, [update]);

  const mask = `linear-gradient(to right, ${[
    fade.left ? "transparent 0" : "#000 0",
    fade.left ? "#000 1.25rem" : null,
    fade.right ? "#000 calc(100% - 1.25rem)" : null,
    fade.right ? "transparent 100%" : "#000 100%",
  ]
    .filter(Boolean)
    .join(", ")})`;

  return (
    <div
      ref={scroller}
      onScroll={update}
      role={role}
      aria-label={label}
      className={cn("no-scrollbar overflow-x-auto", className)}
      style={{ WebkitMaskImage: mask, maskImage: mask }}
    >
      <div ref={content} className={cn("flex w-max gap-3", innerClassName)}>
        {children}
      </div>
    </div>
  );
}
