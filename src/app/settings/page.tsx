"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePreferences, useHasHydrated } from "@/lib/store";
import { DEFAULT_PREFERENCES } from "@/lib/mock";
import { LEAGUES, LEAGUE_ORDER, SPORTS, SPORT_ORDER } from "@/lib/leagues";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/brand/Wordmark";
import { Card, CardHeader } from "@/components/ui/Card";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { Headshot } from "@/components/ui/Headshot";
import { EmptyState } from "@/components/ui/States";
import { TeamPicker } from "@/components/setup/TeamPicker";
import { PlayerPicker } from "@/components/setup/PlayerPicker";

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={`Unfollow ${label}`}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-faint transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-loss/12 hover:text-loss active:scale-90"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold",
        "transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.96]",
        active
          ? "border-primary/55 bg-primary/15 text-ink"
          : "border-line/70 bg-bg-2/50 text-muted hover:border-line hover:text-ink",
      )}
    >
      <span
        className={cn(
          "grid h-3.5 w-3.5 place-items-center rounded-full text-[9px]",
          active ? "bg-primary text-primary-ink" : "border border-line-soft",
        )}
      >
        {active ? "✓" : ""}
      </span>
      {children}
    </button>
  );
}

/** A header button that opens/closes an inline editor panel. */
function SectionToggle({ open, onClick, label }: { open: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold",
        "transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.96]",
        open
          ? "border-line bg-surface-2 text-ink"
          : "border-primary/45 bg-primary/12 text-primary-bright hover:bg-primary/18",
      )}
    >
      {open ? (
        "Done"
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

type Editor = "sports" | "teams" | "players" | null;

export default function SettingsPage() {
  const hydrated = useHasHydrated();
  const router = useRouter();
  const {
    sports,
    leagues,
    teams,
    players,
    toggleSport,
    toggleLeague,
    toggleTeam,
    togglePlayer,
    setSports,
    setLeagues,
    setTeams,
    setPlayers,
  } = usePreferences();

  const [editor, setEditor] = useState<Editor>(null);
  const toggle = (e: Editor) => setEditor((cur) => (cur === e ? null : e));

  function restoreDefaults() {
    setSports(DEFAULT_PREFERENCES.sports);
    setLeagues(DEFAULT_PREFERENCES.leagues);
    setTeams(DEFAULT_PREFERENCES.teams);
    setPlayers(DEFAULT_PREFERENCES.players);
  }

  function clearAll() {
    setTeams([]);
    setPlayers([]);
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/72 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="rounded-md transition-opacity hover:opacity-85">
            <Wordmark />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-line/70 bg-surface/60 px-3.5 py-1.5 text-[13px] font-semibold text-muted transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-surface-2 hover:text-ink active:scale-[0.97]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink">
            Settings
          </h1>
          <p className="mt-1.5 text-[14px] text-muted">
            Manage the sports, teams and players that shape your dashboard. Changes save instantly to this device.
          </p>
        </div>

        {!hydrated ? (
          <div className="space-y-4">
            <div className="skeleton h-32 rounded-lg" />
            <div className="skeleton h-48 rounded-lg" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Sports & leagues */}
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-[15px] font-bold text-ink">Sports &amp; leagues</h2>
                  <p className="mt-0.5 text-[13px] text-muted">What you follow at the top level.</p>
                </div>
                <SectionToggle open={editor === "sports"} onClick={() => toggle("sports")} label="Edit" />
              </div>

              {editor === "sports" ? (
                <div className="mt-4 space-y-3.5">
                  <div>
                    <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">Sports</div>
                    <div className="flex flex-wrap gap-2">
                      {SPORT_ORDER.map((s) => (
                        <ToggleChip key={s} active={sports.includes(s)} onClick={() => toggleSport(s)}>
                          {SPORTS[s].name}
                        </ToggleChip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">Leagues</div>
                    <div className="flex flex-wrap gap-2">
                      {LEAGUE_ORDER.map((l) => (
                        <ToggleChip key={l} active={leagues.includes(l)} onClick={() => toggleLeague(l)}>
                          {LEAGUES[l].name}
                        </ToggleChip>
                      ))}
                    </div>
                  </div>
                  <p className="text-[12px] text-faint">
                    Removing a league also removes its followed teams and players.
                  </p>
                </div>
              ) : (
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {leagues.length === 0 ? (
                    <span className="text-[13px] text-faint">Nothing followed yet.</span>
                  ) : (
                    leagues.map((l) => (
                      <span
                        key={l}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line/70 bg-bg-2/60 px-2.5 py-1 text-[12px] font-medium text-muted"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-bright" />
                        {LEAGUES[l].fullName}
                      </span>
                    ))
                  )}
                </div>
              )}
            </Card>

            {/* Teams */}
            <Card>
              <CardHeader
                title="Teams"
                eyebrow={`${teams.length} followed`}
                action={<SectionToggle open={editor === "teams"} onClick={() => toggle("teams")} label="Add teams" />}
              />
              <div className="mt-2 px-2 pb-2">
                {teams.length === 0 ? (
                  <EmptyState title="No teams followed" body="Add teams below to build your dashboard." />
                ) : (
                  teams.map((t) => (
                    <div
                      key={`${t.league}:${t.teamId}`}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-bg-2/40"
                    >
                      <TeamLogo src={t.logo} name={t.displayName} abbr={t.abbreviation} color={t.color} size={30} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-semibold text-ink">{t.displayName}</div>
                        <div className="text-[12px] text-faint">{LEAGUES[t.league].name}</div>
                      </div>
                      <RemoveButton onClick={() => toggleTeam(t)} label={t.displayName} />
                    </div>
                  ))
                )}
              </div>
              {editor === "teams" && (
                <div className="border-t border-line-soft/70 p-4">
                  {leagues.length === 0 ? (
                    <EmptyState title="Pick a league first" body="Add a league under Sports & leagues, then come back to add teams." />
                  ) : (
                    <TeamPicker leagues={leagues} selected={teams} onToggle={toggleTeam} />
                  )}
                </div>
              )}
            </Card>

            {/* Players */}
            <Card>
              <CardHeader
                title="Players"
                eyebrow={`${players.length} followed`}
                action={<SectionToggle open={editor === "players"} onClick={() => toggle("players")} label="Add players" />}
              />
              <div className="mt-2 px-2 pb-2">
                {players.length === 0 ? (
                  <EmptyState title="No players followed" body="Add players below to track their season." />
                ) : (
                  players.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-bg-2/40"
                    >
                      <Headshot src={p.headshot} name={p.fullName} size={34} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-semibold text-ink">{p.fullName}</div>
                        <div className="text-[12px] text-faint">
                          {p.teamAbbr} · {p.position} · {LEAGUES[p.league].name}
                        </div>
                      </div>
                      <RemoveButton onClick={() => togglePlayer(p)} label={p.fullName} />
                    </div>
                  ))
                )}
              </div>
              {editor === "players" && (
                <div className="border-t border-line-soft/70 p-4">
                  {teams.length === 0 ? (
                    <EmptyState title="Follow a team first" body="Players are picked from the rosters of teams you follow." />
                  ) : (
                    <PlayerPicker teams={teams} selected={players} onToggle={togglePlayer} />
                  )}
                </div>
              )}
            </Card>

            {/* Data controls */}
            <Card className="p-5">
              <h2 className="font-display text-[15px] font-bold text-ink">Manage data</h2>
              <p className="mt-0.5 text-[13px] text-muted">
                Preferences live in this browser&apos;s local storage.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <button
                  onClick={restoreDefaults}
                  className="rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-ink transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-primary-bright active:scale-[0.97]"
                >
                  Restore demo defaults
                </button>
                <Link
                  href="/setup"
                  className="rounded-full border border-line bg-surface-2 px-4 py-2 text-[13px] font-semibold text-muted transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-surface-3 hover:text-ink active:scale-[0.97]"
                >
                  Re-run setup
                </Link>
                <button
                  onClick={clearAll}
                  className="rounded-full border border-line bg-surface-2 px-4 py-2 text-[13px] font-semibold text-muted transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-surface-3 hover:text-ink active:scale-[0.97]"
                >
                  Clear all follows
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="rounded-full px-4 py-2 text-[13px] font-semibold text-faint transition-colors hover:text-ink"
                >
                  Done
                </button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </>
  );
}
