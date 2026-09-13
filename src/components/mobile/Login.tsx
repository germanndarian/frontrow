"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { PillButton } from "./primitives";

/* Email + password sign-in / sign-up for the iOS app. Google and GitHub are
   deliberately absent: Google refuses OAuth from an embedded WebView, so the
   app offers the methods that actually work here. */

type Mode = "signin" | "signup";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block rounded-[16px] border border-line bg-surface px-4 py-[13px]">
      <span className="block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-faint">{label}</span>
      {children}
    </label>
  );
}

// 16px on purpose: iOS zooms into any focused input smaller than that.
const inputClass = "mt-[3px] w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-faint";

export function Login({ mode, onMode, onBack, onGuest }: { mode: Mode; onMode: (m: Mode) => void; onBack: () => void; onGuest: () => void }) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const signup = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    const result = signup ? await signUp({ email, displayName, password }) : await signIn({ email, password });
    setPending(false);
    if (!result.ok) return setError(result.error ?? "Something went wrong.");
    if (result.needsConfirm) setConfirmSent(true);
    // On success the auth store flips to "authed" and the /app gate moves on.
  }

  return (
    <div
      className="min-h-dvh bg-bg"
      style={{ backgroundImage: "radial-gradient(52rem 34rem at 6% -10%, oklch(.68 .16 257/.14), transparent 60%)", backgroundRepeat: "no-repeat" }}
    >
      <div className="flex items-center justify-between px-5" style={{ paddingTop: "max(56px, calc(env(safe-area-inset-top) + 20px))" }}>
        <button type="button" onClick={onBack} aria-label="Back" className="h-[38px] w-[38px] rounded-full border border-line/80 bg-surface/70 text-[16px] font-semibold text-muted">
          ←
        </button>
        <div className="flex items-center gap-[7px]">
          <Image src="/stadium-logo.png" alt="" width={22} height={22} className="h-[22px] w-[22px] rounded-[6px] object-cover" />
          <span className="font-display text-[14px] font-black leading-none tracking-[-0.02em] text-ink">
            FRONT<span className="text-primary">ROW</span>
          </span>
        </div>
        <span className="w-[38px]" />
      </div>

      <form onSubmit={onSubmit} className="px-5 pb-10 pt-10">
        <h1 className="m-0 font-display text-[32px] font-black leading-[1.05] tracking-[-0.03em] text-ink">
          {signup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2.5 text-[14.5px] leading-[1.5] text-muted">
          {signup ? "Your follows and settings sync to your account." : "Sign in to load your teams, players and tuned-in look."}
        </p>

        <div className="mt-7 grid grid-cols-2 gap-1 rounded-full border border-line/80 bg-bg-2 p-1">
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                onMode(m);
                setError(null);
              }}
              className={mode === m ? "rounded-full bg-primary py-2.5 text-[13.5px] font-semibold text-primary-ink" : "rounded-full py-2.5 text-[13.5px] font-semibold text-muted"}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        {confirmSent ? (
          <div className="mt-6 rounded-[16px] border border-line bg-surface p-4 text-[14px] leading-relaxed text-muted">
            <span className="font-semibold text-ink">Check your email.</span> We sent a confirmation link to {email}. Tap it, then come back and sign in.
          </div>
        ) : (
          <>
            <div className="mt-[22px] flex flex-col gap-3">
              <Field label="Email">
                <input className={inputClass} type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </Field>
              {signup && (
                <Field label="Display name">
                  <input className={inputClass} type="text" autoComplete="name" maxLength={60} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Optional — used to greet you" />
                </Field>
              )}
              <div className="flex items-end gap-3 rounded-[16px] border border-line bg-surface px-4 py-[13px]">
                <label className="block flex-1">
                  <span className="block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-faint">Password</span>
                  <input className={inputClass} type={shown ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} required minLength={signup ? 8 : 1} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" />
                </label>
                <button type="button" onClick={() => setShown((s) => !s)} className="-my-1.5 -mr-2 h-11 w-11 text-[14px] text-faint">
                  {shown ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && <p className="mt-3 text-[13px] font-medium text-loss">{error}</p>}

            <PillButton type="submit" disabled={pending} className="mt-[18px] py-4 text-[15.5px]">
              {pending ? "One moment…" : signup ? "Create account" : "Sign in"}
            </PillButton>
          </>
        )}

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[11px] font-semibold tracking-[0.14em] text-faint">OR</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <PillButton variant="ghost" onClick={onGuest} className="py-3.5">
          Continue as guest
        </PillButton>
        <p className="mt-3.5 text-center text-[12px] leading-[1.55] text-faint">
          Guest mode doesn&apos;t save — your picks reset on reload. Create an account to keep them.
        </p>
      </form>
    </div>
  );
}
