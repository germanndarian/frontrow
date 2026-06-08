"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useAppReady, useIsAuthed } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/brand/Wordmark";
import { Spinner } from "@/components/ui/States";

type Mode = "signin" | "signup";

/** Reveal/hide toggle: the eye blinks open and a slash draws across when hidden. */
function EyeToggle({ shown, onClick }: { shown: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={shown ? "Hide password" : "Show password"}
      aria-pressed={shown}
      className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-faint transition-[color,background-color,transform] duration-150 hover:bg-surface-2 hover:text-ink active:scale-90"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <g
          style={{
            transformOrigin: "12px 12px",
            transform: shown ? "scaleY(1)" : "scaleY(0.78)",
            transition: "transform .28s cubic-bezier(.16,1,.3,1)",
          }}
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle
            cx="12"
            cy="12"
            r="3"
            style={{
              transformOrigin: "12px 12px",
              transform: shown ? "scale(1)" : "scale(0.6)",
              transition: "transform .28s cubic-bezier(.16,1,.3,1)",
            }}
          />
        </g>
        <line
          x1="3"
          y1="3"
          x2="21"
          y2="21"
          pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: shown ? 0 : 1,
            transition: "stroke-dashoffset .3s ease",
          }}
        />
      </svg>
    </button>
  );
}

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
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-faint">
        {label}
      </span>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className={cn(
            "w-full rounded-md border border-line/70 bg-bg-2/60 px-3.5 py-2.5 text-[14px] text-ink placeholder:text-faint/70 transition-colors focus:border-primary/60 focus:bg-bg-2",
            isPassword && "pr-11",
          )}
        />
        {isPassword && <EyeToggle shown={show} onClick={() => setShow((s) => !s)} />}
      </div>
    </label>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const ready = useAppReady();
  const authed = useIsAuthed();
  const { signIn, signUp, continueAsGuest } = useAuth();

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

        <button
          type="button"
          onClick={asGuest}
          className="w-full rounded-full border border-line bg-surface/60 px-5 py-2.5 text-[13.5px] font-semibold text-muted transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-surface-2 hover:text-ink active:scale-[0.98]"
        >
          Continue as guest
        </button>
        <p className="mt-3 text-center text-[11.5px] leading-relaxed text-faint">
          Guest mode doesn&apos;t save — your picks reset on reload. Create an
          account to keep them.
        </p>
      </div>
    </div>
  );
}
