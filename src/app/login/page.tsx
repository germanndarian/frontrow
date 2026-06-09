"use client";

import { useEffect, useState } from "react";
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
  const { signIn, signUp, signInWithGoogle, continueAsGuest } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

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
        ? await signIn({ email, password })
        : await signUp({ email, displayName, password });
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    if (result.needsConfirm) {
      setConfirmSent(true);
      return;
    }
    router.replace("/");
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  function asGuest() {
    continueAsGuest();
    router.replace("/");
  }

  async function onGoogle() {
    setError(null);
    // On success the browser redirects to Google, so this only returns on error.
    const result = await signInWithGoogle();
    if (!result.ok) setError(result.error ?? "Couldn't start Google sign-in.");
  }

  if (confirmSent) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px] text-center">
          <Wordmark />
          <div className="mx-auto mt-8 grid h-14 w-14 place-items-center rounded-full border border-primary/40 bg-primary/12 text-primary-bright">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </div>
          <h1 className="mt-5 font-display text-[22px] font-extrabold tracking-[-0.02em] text-ink">
            Check your inbox
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            We sent a confirmation link to{" "}
            <span className="font-semibold text-ink">{email}</span>. Click it to
            finish creating your account, then sign in.
          </p>
          <button
            onClick={() => {
              setConfirmSent(false);
              setMode("signin");
            }}
            className="mt-6 rounded-full border border-line bg-surface/60 px-5 py-2.5 text-[13.5px] font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
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
              : "Your follows and settings sync to your account."}
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
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
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

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onGoogle}
            className="flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-bg transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:opacity-90 active:scale-[0.98]"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.45.35-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.29 9.14 5.38 12 5.38z" />
            </svg>
            Continue with Google
          </button>
          <button
            type="button"
            onClick={asGuest}
            className="w-full rounded-full border border-line bg-surface/60 px-5 py-2.5 text-[13.5px] font-semibold text-muted transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-surface-2 hover:text-ink active:scale-[0.98]"
          >
            Continue as guest
          </button>
        </div>
        <p className="mt-3 text-center text-[11.5px] leading-relaxed text-faint">
          Guest mode doesn&apos;t save — your picks reset on reload. Create an
          account to keep them.
        </p>
      </div>
    </div>
  );
}
