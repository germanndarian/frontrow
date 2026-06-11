"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo";
import { useHasHydrated } from "@/lib/store";
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
  const router = useRouter();
  const signOut = useAuth((s) => s.signOut);
  const hydrated = useHasHydrated();
  const demo = hydrated && isDemoMode();

  // Leaving the dashboard for the homepage ends the session, by design.
  async function goHome() {
    await signOut();
    router.replace("/");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/72 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/dashboard" className="rounded-md transition-opacity hover:opacity-85">
          <Wordmark />
        </Link>

        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {demo && (
            <span
              title="Previewing the offline demo dataset — no account, sample data"
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/12 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-gold"
            >
              Demo
            </span>
          )}
          {liveCount > 0 && (
            <span className="hidden items-center gap-1.5 rounded-full bg-live/12 px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-live sm:inline-flex">
              <span className="live-dot" />
              {liveCount} live
            </span>
          )}
          <span className="hidden text-[13px] font-medium text-faint md:inline">
            {todayLabel()}
          </span>
          <button
            type="button"
            onClick={goHome}
            title="Log out and return to the home page"
            className="inline-flex items-center gap-1.5 rounded-full border border-line/60 bg-surface/50 px-2.5 py-1.5 text-[13px] font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
            </svg>
            <span className="hidden sm:inline">Home</span>
          </button>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
