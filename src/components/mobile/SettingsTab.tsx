"use client";

import { useState } from "react";
import { AVATAR_EMOJIS, useAuth, useCurrentUser } from "@/lib/auth";
import { usePreferences } from "@/lib/store";
import { ACCENTS, ACCENT_ORDER, SECTION_LABELS, SECTION_ORDER, useSettings } from "@/lib/settings";
import { LEAGUES, LEAGUE_ORDER } from "@/lib/leagues";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { Eyebrow, Panel, PillButton, Segmented, Switch } from "./primitives";
import { cn } from "@/lib/utils";

/* Settings tab: the full settings surface, on the same stores the website
   uses so a change here is a change everywhere. Sign out lives here and only
   here — the app has no Home button that ends the session. */

function Section({ title, sub, children, action }: { title: string; sub?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Panel className="p-[18px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 font-display text-[15px] font-bold text-ink">{title}</h2>
          {sub && <p className="m-0 mt-[3px] text-[12.5px] text-muted">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </Panel>
  );
}

const field = "mt-1.5 w-full rounded-[14px] border border-line bg-bg-2/60 px-3.5 py-3 text-[16px] text-ink outline-none focus:border-primary/60";

export function SettingsTab({ onEditFollows }: { onEditFollows: () => void }) {
  const profile = useCurrentUser();
  const status = useAuth((s) => s.status);
  const { signOut, deleteAccount, updateProfile } = useAuth();
  const settings = useSettings();
  const prefs = usePreferences();
  const guest = status === "guest";
  const [name, setName] = useState(profile?.displayName ?? "");
  const [busy, setBusy] = useState(false);

  async function onSignOut() {
    setBusy(true);
    await signOut();
    // The /app gate sees status "out" and returns to the welcome screen.
  }
  async function onDelete() {
    if (!confirm("Delete your account and everything you follow? This can't be undone.")) return;
    setBusy(true);
    const r = await deleteAccount();
    if (!r.ok) {
      setBusy(false);
      alert(r.error ?? "Couldn't delete the account.");
    }
  }

  const leagueNames = LEAGUE_ORDER.filter((l) => prefs.leagues.includes(l)).map((l) => LEAGUES[l].fullName);

  return (
    <div className="flex flex-col gap-3.5 px-[18px] pb-6 pt-4">
      <Panel className="p-[18px]">
        <div className="flex items-center gap-3.5">
          <span className="grid h-[58px] w-[58px] place-items-center rounded-full text-[27px]" style={{ background: profile?.avatarColor ?? "var(--color-bg-2)" }}>
            {profile?.avatarEmoji ?? "⚾️"}
          </span>
          <div className="min-w-0">
            <h2 className="m-0 truncate font-display text-[19px] font-extrabold text-ink">{guest ? "Guest" : profile?.displayName || "Your account"}</h2>
            <p className="m-0 mt-0.5 truncate text-[12.5px] text-faint">{guest ? "Nothing saves in guest mode" : profile?.email}</p>
          </div>
        </div>
        {!guest && (
          <>
            <div className="mt-4 flex flex-wrap gap-[7px]">
              {AVATAR_EMOJIS.map((e) => (
                <button key={e} type="button" onClick={() => updateProfile({ avatarEmoji: e })} aria-label={`Avatar ${e}`} className={cn("grid h-[42px] w-[42px] place-items-center rounded-[13px] border text-[19px]", profile?.avatarEmoji === e ? "border-primary/60 bg-primary/10" : "border-line bg-bg-2/60")}>
                  {e}
                </button>
              ))}
            </div>
            <label className="mt-4 block">
              <Eyebrow>Display name</Eyebrow>
              <input className={field} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name !== profile?.displayName && updateProfile({ displayName: name })} placeholder="How should we greet you?" />
            </label>
          </>
        )}
      </Panel>

      <Section title="Appearance" sub="Changes apply instantly.">
        <div className="mt-4 flex flex-col gap-3.5">
          <Segmented label="Theme" hint="System follows your device." value={settings.appearance} options={[{ label: "System", value: "system" }, { label: "Light", value: "light" }, { label: "Dark", value: "dark" }]} onChange={(v) => settings.set("appearance", v)} />
          <Segmented label="Corner roundness" hint="Cards, chips and buttons." value={settings.radius} options={[{ label: "Sharp", value: "sharp" }, { label: "Default", value: "default" }, { label: "Round", value: "round" }]} onChange={(v) => settings.set("radius", v)} />
          <Segmented label="Density" hint="Compact tightens spacing." value={settings.density} options={[{ label: "Comfortable", value: "comfortable" }, { label: "Compact", value: "compact" }]} onChange={(v) => settings.set("density", v)} />
          <div>
            <Eyebrow className="mb-2">Accent color</Eyebrow>
            <div className="flex flex-wrap gap-2.5">
              {ACCENT_ORDER.map((id) => (
                <button key={id} type="button" onClick={() => settings.set("accent", id)} aria-label={ACCENTS[id].name} className="h-9 w-9 rounded-full" style={{ background: ACCENTS[id].swatch, border: settings.accent === id ? "2px solid var(--color-ink)" : "1px solid var(--color-line)", boxShadow: settings.accent === id ? "0 0 0 3px var(--color-surface) inset" : "none" }} />
              ))}
            </div>
          </div>
          <Switch label="Background glow" hint="The cobalt floodlights bled over the page." on={settings.backgroundGlow} onToggle={() => settings.set("backgroundGlow", !settings.backgroundGlow)} />
          <Switch label="Reduce motion" hint="Minimize animations and transitions." on={settings.reduceMotion} onToggle={() => settings.set("reduceMotion", !settings.reduceMotion)} />
        </div>
      </Section>

      <Section title="Dashboard" sub="What greets you and which sections show.">
        <label className="mt-3.5 block">
          <Eyebrow>Greeting name</Eyebrow>
          <input className={field} maxLength={40} value={settings.greetingName} onChange={(e) => settings.set("greetingName", e.target.value)} placeholder={profile?.displayName || "Your name"} />
        </label>
        <Eyebrow className="mt-3.5">Visible sections</Eyebrow>
        <div className="mt-1">
          {SECTION_ORDER.map((id) => (
            <Switch key={id} label={SECTION_LABELS[id]} on={!settings.hiddenSections.includes(id)} onToggle={() => settings.toggleSection(id)} />
          ))}
        </div>
      </Section>

      <Section
        title="Sports & leagues"
        sub="What you follow at the top level."
        action={<button type="button" onClick={onEditFollows} className="rounded-full border border-primary/45 bg-primary/12 px-3.5 py-2 text-[12.5px] font-semibold text-primary">Edit</button>}
      >
        <div className="mt-3.5 flex flex-wrap gap-[7px]">
          {leagueNames.length ? leagueNames.map((l) => (
            <span key={l} className="inline-flex items-center gap-[7px] rounded-full border border-line bg-bg-2/60 px-3 py-[7px] text-[12px] font-medium text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />{l}
            </span>
          )) : <span className="text-[12.5px] text-faint">Nothing followed yet.</span>}
        </div>
      </Section>

      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-[18px] pb-3 pt-4">
          <div>
            <Eyebrow>{prefs.teams.length} followed</Eyebrow>
            <h2 className="m-0 mt-px font-display text-[15px] font-bold text-ink">Teams</h2>
          </div>
          <button type="button" onClick={onEditFollows} className="rounded-full border border-primary/45 bg-primary/12 px-3.5 py-2 text-[12.5px] font-semibold text-primary">+ Add</button>
        </div>
        {prefs.teams.map((t) => (
          <div key={`${t.league}:${t.teamId}`} className="flex items-center gap-3 border-t border-line-soft/70 px-[18px] py-[11px]">
            <TeamLogo src={t.logo} name={t.displayName} abbr={t.abbreviation} color={t.color} size={32} className="rounded-[10px]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold text-ink">{t.displayName}</span>
              <span className="block text-[12px] text-faint">{LEAGUES[t.league].name}</span>
            </span>
            <button type="button" onClick={() => prefs.toggleTeam(t)} aria-label={`Unfollow ${t.displayName}`} className="grid h-[34px] w-[34px] place-items-center rounded-full text-[15px] text-faint">✕</button>
          </div>
        ))}
        {prefs.players.length > 0 && (
          <>
            <div className="border-t border-line-soft px-[18px] pb-2 pt-3.5"><Eyebrow>{prefs.players.length} starred</Eyebrow></div>
            {prefs.players.map((p) => (
              <div key={`${p.league}:${p.id}`} className="flex items-center gap-3 border-t border-line-soft/70 px-[18px] py-[11px]">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-ink">{p.fullName}</span>
                  <span className="block text-[12px] text-faint">{p.teamAbbr} · {p.position}</span>
                </span>
                <button type="button" onClick={() => prefs.togglePlayer(p)} aria-label={`Unstar ${p.fullName}`} className="grid h-[34px] w-[34px] place-items-center rounded-full text-[15px] text-faint">✕</button>
              </div>
            ))}
          </>
        )}
      </Panel>

      <div className="flex flex-col gap-2.5 pb-2.5 pt-1">
        <PillButton variant="ghost" onClick={onSignOut} disabled={busy}>{guest ? "Exit guest mode" : "Sign out"}</PillButton>
        {!guest && <PillButton variant="danger" onClick={onDelete} disabled={busy}>Delete account</PillButton>}
        <p className="mt-1.5 text-center text-[11.5px] leading-[1.5] text-faint">Frontrow · live scores and stats via ESPN&apos;s public endpoints. Unofficial data, refreshed as games unfold.</p>
      </div>
    </div>
  );
}
