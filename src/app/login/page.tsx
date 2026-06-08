"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useAppReady, useIsAuthed } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/brand/Wordmark";
import { Spinner } from "@/components/ui/States";

type Mode = "signin" | "signup";

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  autoFocus,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-faint">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className="w-full rounded-md border border-line/70 bg-bg-2/60 px-3.5 py-2.5 text-[14px] text-ink placeholder:text-faint/70 transition-colors focus:border-primary/60 focus:bg-bg-2"
      />
    </label>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const ready = useAppReady();
  const authed = useIsAuthed();
  const { logIn, signUp, continueAsGuest } = useAuth();
  const accountCount = useAuth((s) => Object.keys(s.accounts).length);

  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New visitors land on "create account"; returning ones default to sign in.
  const decided = useRef(false);
  useEffect(() => {
    if (ready && !decided.current) {
      decided.current = true;
      setMode(accountCount === 0 ? "signup" : "signin");
    }
  }, [ready, accountCount]);

  useEffect(() => {
    if (ready && authed) router.replace("/");
  }, [ready, authed, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    const result =
      mode === "signin"
        ? await logIn({ username, password, remember })
        : await signUp({ username, displayName, password, remember });
    setPending(false);
    if (result.ok) router.replace("/");
    else setError(result.error ?? "Something went wrong.");
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  function asGuest() {
    continueAsGuest();
    router.replace("/");
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Wordmark />
          <h1 className="mt-6 font-display text-[24px] font-extrabold tracking-[-0.02em] text-ink">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 max-w-[32ch] text-[13.5px] leading-relaxed text-muted">
            {mode === "signin"
              ? "Sign in to load your teams, players and tuned-in look."
              : "Your follows and settings stay saved to this profile."}
          </p>
        </div>

        {/* Mode switch */}
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-full border border-line/70 bg-bg-2/50 p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={cn(
                "rounded-full py-2 text-[13px] font-semibold transition-[background-color,color] duration-150",
                mode === m
                  ? "bg-primary text-primary-ink"
                  : "text-muted hover:text-ink",
              )}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          <Field
            label="Username"
            value={username}
            onChange={setUsername}
            placeholder="e.g. courtside"
            autoComplete="username"
            autoFocus
          />
          {mode === "signup" && (
            <Field
              label="Display name"
              value={displayName}
              onChange={setDisplayName}
              placeholder="Optional — shown in the header"
              autoComplete="nickname"
            />
          )}
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />

          <label className="flex cursor-pointer items-center gap-2.5 pt-0.5 text-[13px] text-muted">
            <button
              type="button"
              role="checkbox"
              aria-checked={remember}
              onClick={() => setRemember((v) => !v)}
              className={cn(
                "grid h-[18px] w-[18px] place-items-center rounded-[5px] border transition-colors",
                remember
                  ? "border-primary bg-primary text-primary-ink"
                  : "border-line bg-bg-2/60",
              )}
            >
              {remember && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>
            Keep me signed in for 30 days
          </label>

          {error && (
            <p className="rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-[12.5px] font-medium text-loss">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[14px] font-bold transition-[transform,background-color,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
              pending
                ? "cursor-wait bg-surface-2 text-faint"
                : "bg-primary text-primary-ink hover:bg-primary-bright active:scale-[0.98]",
            )}
          >
            {pending && <Spinner className="!h-4 !w-4" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-line-soft" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
            or
          </span>
          <span className="h-px flex-1 bg-line-soft" />
        </div>

        <button
          type="button"
          onClick={asGuest}
          className="w-full rounded-full border border-line bg-surface/60 px-5 py-2.5 text-[13.5px] font-semibold text-muted transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-surface-2 hover:text-ink active:scale-[0.98]"
        >
          Continue as guest
        </button>
        <p className="mt-3 text-center text-[11.5px] leading-relaxed text-faint">
          Accounts live only in this browser. Passwords are hashed locally — this
          is a personal profile, not cloud sign-in.
        </p>
      </div>
    </div>
  );
}
