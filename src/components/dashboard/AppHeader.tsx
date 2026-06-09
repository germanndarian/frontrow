"use client";

import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { AccountMenu } from "./AccountMenu";

function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function AppHeader({ liveCount }: { liveCount: number }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/72 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/dashboard" className="rounded-md transition-opacity hover:opacity-85">
          <Wordmark />
        </Link>

        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {liveCount > 0 && (
            <span className="hidden items-center gap-1.5 rounded-full bg-live/12 px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-live sm:inline-flex">
              <span className="live-dot" />
              {liveCount} live
            </span>
          )}
          <span className="hidden text-[13px] font-medium text-faint md:inline">
            {todayLabel()}
          </span>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
