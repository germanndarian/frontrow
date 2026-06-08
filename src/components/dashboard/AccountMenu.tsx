"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useCurrentUser } from "@/lib/auth";

function Avatar({
  emoji,
  color,
  size = 34,
}: {
  emoji: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.5,
      }}
    >
      {emoji}
    </span>
  );
}

export function AccountMenu() {
  const router = useRouter();
  const user = useCurrentUser();
  const guest = useAuth((s) => s.status === "guest");
  const signOut = useAuth((s) => s.signOut);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.replace("/login");
  }

  const label = user ? user.displayName : "Guest";
  const sub = user ? user.email : "Browsing without an account";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="grid h-9 w-9 place-items-center rounded-full border border-line/70 bg-surface/60 transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-surface-2 active:scale-95"
      >
        {user ? (
          <Avatar emoji={user.avatarEmoji} color={user.avatarColor} size={28} />
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21v-1a7 7 0 0 1 14 0v1" />
          </svg>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-40 w-60 origin-top-right overflow-hidden rounded-lg border border-line/70 bg-surface/95 shadow-[0_18px_44px_-20px_oklch(0_0_0/0.8)] backdrop-blur-xl"
          style={{ animation: "bx-rise 0.18s var(--ease-out-expo) both" }}
        >
          <div className="flex items-center gap-3 border-b border-line-soft/70 px-4 py-3.5">
            {user ? (
              <Avatar emoji={user.avatarEmoji} color={user.avatarColor} />
            ) : (
              <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-surface-2 text-muted">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21v-1a7 7 0 0 1 14 0v1" />
                </svg>
              </span>
            )}
            <div className="min-w-0">
              <div className="truncate text-[14px] font-bold text-ink">{label}</div>
              <div className="truncate text-[12px] text-faint">{sub}</div>
            </div>
          </div>

          <div className="p-1.5">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] font-medium text-muted transition-colors hover:bg-bg-2/60 hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
              Settings
            </Link>
            {guest && (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                role="menuitem"
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] font-medium text-primary-bright transition-colors hover:bg-primary/10"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M19 8v6m3-3h-6" />
                </svg>
                Create an account
              </Link>
            )}
            <button
              onClick={handleSignOut}
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13.5px] font-medium text-muted transition-colors hover:bg-loss/10 hover:text-loss"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="m16 17 5-5-5-5M21 12H9" />
              </svg>
              {guest ? "Exit guest mode" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
