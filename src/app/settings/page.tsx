"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/lib/store";
import {
  useAuth,
  useCurrentUser,
  useIsAuthed,
  useAppReady,
  AVATAR_EMOJIS,
  AVATAR_COLORS,
} from "@/lib/auth";
import {
  useSettings,
  ACCENTS,
  ACCENT_ORDER,
  SECTION_LABELS,
  SECTION_ORDER,
  type AccentId,
  type Appearance,
  type Density,
  type Radius,
} from "@/lib/settings";
import { LEAGUES, LEAGUE_ORDER } from "@/lib/leagues";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/brand/Wordmark";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/States";
import { FollowsPanel } from "@/components/settings/FollowsPanel";

/* ── Small shared controls ───────────────────────────────────────────────── */

function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 py-2 text-left"
    >
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-[12px] text-faint">{hint}</span>}
      </span>
      <span
        className={cn(
          "relative h-6 w-[42px] shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-primary" : "bg-surface-3",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 grid h-5 w-5 place-items-center rounded-full bg-ink transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
            checked ? "translate-x-[19px]" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-line/70 bg-bg-2/50 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-[background-color,color] duration-150",
            value === o.value
              ? "bg-primary text-primary-ink"
              : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SettingRow({
  label,
  hint,
  control,
}: {
  label: string;
  hint?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold text-ink">{label}</div>
        {hint && <div className="mt-0.5 text-[12px] text-faint">{hint}</div>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

/* ── Profile ─────────────────────────────────────────────────────────────── */

function ProfileCard() {
  const user = useCurrentUser();
  const guest = useAuth((s) => s.status === "guest");
  const { updateProfile, changePassword, deleteAccount, signOut } = useAuth();
  const router = useRouter();

  const [pwOpen, setPwOpen] = useState(false);
  const [next, setNext] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);
  const [delBusy, setDelBusy] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  async function removeAccount() {
    if (
      !window.confirm(
        "Delete this account and everything saved to it? This can't be undone.",
      )
    )
      return;
    setDelBusy(true);
    const res = await deleteAccount();
    setDelBusy(false);
    if (res.ok) router.replace("/login");
    else window.alert(res.error ?? "Couldn't delete the account.");
  }

  async function submitPassword() {
    setPwMsg(null);
    setPwBusy(true);
    const res = await changePassword(next);
    setPwBusy(false);
    if (res.ok) {
      setPwMsg({ ok: true, text: "Password updated." });
      setNext("");
      setPwOpen(false);
    } else {
      setPwMsg({ ok: false, text: res.error ?? "Couldn't update password." });
    }
  }

  if (guest || !user) {
    return (
      <Card className="p-5">
        <h2 className="font-display text-[15px] font-bold text-ink">Profile</h2>
        <p className="mt-0.5 text-[13px] text-muted">
          You&apos;re browsing as a guest. Create an account to save these
          settings and your follows under your own profile.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link
            href="/login"
            className="rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-ink transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-primary-bright active:scale-[0.97]"
          >
            Create an account
          </Link>
          <button
            onClick={handleSignOut}
            className="rounded-full border border-line bg-surface-2 px-4 py-2 text-[13px] font-semibold text-muted transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-surface-3 hover:text-ink active:scale-[0.97]"
          >
            Exit guest mode
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <span
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-[26px]"
          style={{ backgroundColor: user.avatarColor }}
        >
          {user.avatarEmoji}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-[18px] font-extrabold text-ink">
            {user.displayName}
          </h2>
          <p className="truncate text-[12.5px] text-faint">{user.email}</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {/* Avatar emoji */}
        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">
            Avatar
          </div>
          <div className="flex flex-wrap gap-1.5">
            {AVATAR_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => updateProfile({ avatarEmoji: e })}
                aria-pressed={user.avatarEmoji === e}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-md border text-[18px] transition-[transform,border-color,background-color] duration-150 active:scale-90",
                  user.avatarEmoji === e
                    ? "border-primary/60 bg-primary/12"
                    : "border-line/60 bg-bg-2/40 hover:border-line",
                )}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => updateProfile({ avatarColor: c })}
                aria-label="Avatar color"
                aria-pressed={user.avatarColor === c}
                className={cn(
                  "h-7 w-7 rounded-full transition-transform duration-150 active:scale-90",
                  user.avatarColor === c
                    ? "ring-2 ring-ink ring-offset-2 ring-offset-surface"
                    : "ring-1 ring-line-soft",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Display name */}
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-faint">
            Display name
          </span>
          <input
            value={user.displayName}
            onChange={(e) => updateProfile({ displayName: e.target.value })}
            maxLength={60}
            className="w-full rounded-md border border-line/70 bg-bg-2/60 px-3.5 py-2.5 text-[14px] text-ink transition-colors focus:border-primary/60"
          />
        </label>

        {/* Email — read-only sign-in identity */}
        <div>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">
            Email
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border border-line/60 bg-bg-2/40 px-3.5 py-2.5">
            <span className="truncate text-[14px] text-muted">{user.email}</span>
            <span className="shrink-0 text-[11px] font-semibold text-faint">Sign-in email</span>
          </div>
        </div>

        {/* Password */}
        {pwOpen ? (
          <div className="rounded-md border border-line-soft/70 bg-bg-2/40 p-3.5">
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="New password (min 6 characters)"
              autoComplete="new-password"
              className="w-full rounded-md border border-line/70 bg-bg/60 px-3 py-2 text-[13.5px] text-ink placeholder:text-faint/70 focus:border-primary/60"
            />
            {pwMsg && (
              <p
                className={cn(
                  "mt-2 text-[12px] font-medium",
                  pwMsg.ok ? "text-win" : "text-loss",
                )}
              >
                {pwMsg.text}
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={submitPassword}
                disabled={pwBusy}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-3.5 py-1.5 text-[12.5px] font-semibold text-primary-ink transition-transform duration-150 hover:bg-primary-bright active:scale-[0.97] disabled:opacity-60"
              >
                {pwBusy && <Spinner className="!h-3.5 !w-3.5" />}
                Save password
              </button>
              <button
                onClick={() => {
                  setPwOpen(false);
                  setPwMsg(null);
                  setNext("");
                }}
                className="rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold text-faint transition-colors hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setPwOpen(true)}
            className="text-[13px] font-semibold text-primary-bright transition-opacity hover:opacity-80"
          >
            Change password
          </button>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2.5 border-t border-line-soft/70 pt-4">
        <button
          onClick={signOut}
          className="rounded-full border border-line bg-surface-2 px-4 py-2 text-[13px] font-semibold text-muted transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-surface-3 hover:text-ink active:scale-[0.97]"
        >
          Sign out
        </button>
        <button
          onClick={removeAccount}
          disabled={delBusy}
          className="inline-flex items-center gap-2 rounded-full border border-loss/30 bg-loss/8 px-4 py-2 text-[13px] font-semibold text-loss transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-loss/15 active:scale-[0.97] disabled:opacity-60"
        >
          {delBusy && <Spinner className="!h-3.5 !w-3.5" />}
          Delete account
        </button>
      </div>
    </Card>
  );
}

/* ── Appearance ──────────────────────────────────────────────────────────── */

function AppearanceCard() {
  const appearance = useSettings((s) => s.appearance);
  const accent = useSettings((s) => s.accent);
  const radius = useSettings((s) => s.radius);
  const density = useSettings((s) => s.density);
  const reduceMotion = useSettings((s) => s.reduceMotion);
  const backgroundGlow = useSettings((s) => s.backgroundGlow);
  const set = useSettings((s) => s.set);

  return (
    <Card className="p-5">
      <h2 className="font-display text-[15px] font-bold text-ink">Appearance</h2>
      <p className="mt-0.5 text-[13px] text-muted">Tune the look to taste — changes apply instantly.</p>

      {/* Theme */}
      <div className="mt-4">
        <SettingRow
          label="Theme"
          hint="System follows your device; light matches the homepage; dark is the original midnight look."
          control={
            <Segmented
              value={appearance}
              onChange={(v) => set("appearance", v as Appearance)}
              options={[
                { label: "System", value: "system" },
                { label: "Light", value: "light" },
                { label: "Dark", value: "dark" },
              ]}
            />
          }
        />
      </div>

      {/* Accent */}
      <div className="mt-4">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">
          Accent color
        </div>
        <div className="flex flex-wrap gap-2.5">
          {ACCENT_ORDER.map((id: AccentId) => (
            <button
              key={id}
              onClick={() => set("accent", id)}
              aria-label={ACCENTS[id].name}
              aria-pressed={accent === id}
              title={ACCENTS[id].name}
              className={cn(
                "grid h-9 w-9 place-items-center rounded-full transition-transform duration-150 active:scale-90",
                accent === id
                  ? "ring-2 ring-ink ring-offset-2 ring-offset-surface"
                  : "ring-1 ring-line-soft hover:ring-line",
              )}
              style={{ backgroundColor: ACCENTS[id].swatch }}
            >
              {accent === id && (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="oklch(0.18 0.02 256)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 divide-y divide-line-soft/60">
        <SettingRow
          label="Corner roundness"
          hint="How rounded cards, chips and buttons appear."
          control={
            <Segmented
              value={radius}
              onChange={(v) => set("radius", v as Radius)}
              options={[
                { label: "Sharp", value: "sharp" },
                { label: "Default", value: "default" },
                { label: "Round", value: "round" },
              ]}
            />
          }
        />
        <SettingRow
          label="Density"
          hint="Compact tightens spacing across the whole app."
          control={
            <Segmented
              value={density}
              onChange={(v) => set("density", v as Density)}
              options={[
                { label: "Comfortable", value: "comfortable" },
                { label: "Compact", value: "compact" },
              ]}
            />
          }
        />
        <Switch
          label="Background glow"
          hint="The cobalt floodlights bled over the page."
          checked={backgroundGlow}
          onChange={(v) => set("backgroundGlow", v)}
        />
        <Switch
          label="Reduce motion"
          hint="Minimize animations and transitions."
          checked={reduceMotion}
          onChange={(v) => set("reduceMotion", v)}
        />
      </div>
    </Card>
  );
}

/* ── Dashboard layout ────────────────────────────────────────────────────── */

function LayoutCard() {
  const greetingName = useSettings((s) => s.greetingName);
  const defaultLeague = useSettings((s) => s.defaultLeague);
  const hiddenSections = useSettings((s) => s.hiddenSections);
  const set = useSettings((s) => s.set);
  const toggleSection = useSettings((s) => s.toggleSection);
  const leagues = usePreferences((s) => s.leagues);

  const leagueOptions = [
    { label: "All", value: "all" },
    ...LEAGUE_ORDER.filter((l) => leagues.includes(l)).map((l) => ({
      label: LEAGUES[l].name,
      value: l,
    })),
  ];

  return (
    <Card className="p-5">
      <h2 className="font-display text-[15px] font-bold text-ink">Dashboard</h2>
      <p className="mt-0.5 text-[13px] text-muted">Shape what greets you and which sections show.</p>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-faint">
          Greeting name
        </span>
        <input
          value={greetingName}
          onChange={(e) => set("greetingName", e.target.value)}
          placeholder="Shown after “Good evening,”"
          maxLength={24}
          className="w-full rounded-md border border-line/70 bg-bg-2/60 px-3.5 py-2.5 text-[14px] text-ink placeholder:text-faint/70 transition-colors focus:border-primary/60"
        />
      </label>

      <div className="mt-4 border-t border-line-soft/60 pt-1">
        <SettingRow
          label="Default league filter"
          hint="Which league the dashboard opens on."
          control={
            <select
              value={defaultLeague}
              onChange={(e) =>
                set("defaultLeague", e.target.value as typeof defaultLeague)
              }
              className="rounded-full border border-line/70 bg-bg-2/60 px-3.5 py-1.5 text-[13px] font-semibold text-ink transition-colors focus:border-primary/60"
            >
              {leagueOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          }
        />
      </div>

      <div className="mt-3">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">
          Visible sections
        </div>
        <div className="space-y-1">
          {SECTION_ORDER.map((id) => (
            <Switch
              key={id}
              label={SECTION_LABELS[id]}
              checked={!hiddenSections.includes(id)}
              onChange={() => toggleSection(id)}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const ready = useAppReady();
  const authed = useIsAuthed();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authed) router.replace("/login");
  }, [ready, authed, router]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/72 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/dashboard" className="rounded-md transition-opacity hover:opacity-85">
            <Wordmark />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[13px] font-bold text-primary-ink transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-primary-bright active:scale-[0.97]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Done
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink">
            Settings
          </h1>
          <p className="mt-1.5 text-[14px] text-muted">
            Your profile, the look of the app, and the sports, teams and players that shape your dashboard.
          </p>
        </div>

        {!ready ? (
          <div className="space-y-4">
            <div className="skeleton h-32 rounded-lg" />
            <div className="skeleton h-48 rounded-lg" />
          </div>
        ) : (
          <div className="space-y-5">
            <ProfileCard />
            <AppearanceCard />
            <LayoutCard />

            <FollowsPanel />
          </div>
        )}
      </main>
    </>
  );
}
