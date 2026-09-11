"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/lib/store";
import { useAppReady, useIsAuthed } from "@/lib/auth";
import { DEFAULT_PREFERENCES } from "@/lib/mock";
import { LEAGUES, SPORTS, SPORT_ORDER, leaguesForSports } from "@/lib/leagues";
import type { FollowedPlayer, FollowedTeam, LeagueId, SportId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SwipePager } from "@/components/mobile/SwipePager";
import { CheckMark } from "./CheckMark";
import { TeamPicker } from "./TeamPicker";
import { PlayerPicker } from "./PlayerPicker";
import { SetupDone } from "./SetupDone";

/* Four-step onboarding — sports → leagues → teams → players — then a Done
   screen. Laid out the way the app mockups are: a fixed header with the step
   rail, a scrolling list of tappable rows, and a fixed footer with back, the
   selection count and the primary action. Steps live in a pager, so on a
   phone you can swipe between them as well as tap. Shared by /setup and /app. */

const STEPS = [
  { title: "Pick your sports", subtitle: "Choose everything you follow. You can add more later." },
  { title: "Choose your leagues", subtitle: "We pre-selected the obvious ones — adjust as you like." },
  { title: "Follow your teams", subtitle: "Search and tap the teams you want on your dashboard." },
  { title: "Star your players", subtitle: "Optional. Add the names you tune in for." },
] as const;

/* Mark-tile colours from the mockup, keyed by sport and league. */
const SPORT_MARK: Record<SportId, string> = { football: "#5a1414", basketball: "#c8512b", baseball: "#0c2340", hockey: "#1d3557" };
const LEAGUE_MARK: Record<LeagueId, string> = { nfl: "#5a1414", "college-football": "#bf5700", nba: "#c8512b", mlb: "#0c2340", nhl: "#1d3557" };
const LEAGUE_TAG: Record<LeagueId, string> = { nfl: "NFL", "college-football": "NCAA", nba: "NBA", mlb: "MLB", nhl: "NHL" };

function SportGlyph({ sport }: { sport: SportId }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;
  if (sport === "football")
    return (
      <svg {...common}>
        <ellipse cx="12" cy="12" rx="9" ry="5.5" transform="rotate(-30 12 12)" />
        <path d="M9.5 14.5 14.5 9.5M10.5 11.5l1 1M12.5 9.5l1 1M11.5 12.5l1 1" />
      </svg>
    );
  if (sport === "baseball")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M6.5 5.8c2 1.6 3 4 3 6.2s-1 4.6-3 6.2M17.5 5.8c-2 1.6-3 4-3 6.2s1 4.6 3 6.2" />
      </svg>
    );
  if (sport === "basketball")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18M3 12h18M5.6 5.6c2.4 2 3.9 4.8 3.9 6.4s-1.5 4.4-3.9 6.4M18.4 5.6c-2.4 2-3.9 4.8-3.9 6.4s1.5 4.4 3.9 6.4" />
      </svg>
    );
  return (
    <svg {...common}>
      <ellipse cx="12" cy="15" rx="8" ry="3" />
      <path d="M4 12.5v2.5M20 12.5v2.5M12 12v6" strokeWidth="1.4" opacity="0.5" />
      <ellipse cx="12" cy="12" rx="8" ry="3" />
    </svg>
  );
}

/** One tappable row: a 44px mark, a name and a line under it, and a check. */
function PickRow({ active, onToggle, mark, name, sub }: { active: boolean; onToggle: () => void; mark: React.ReactNode; name: string; sub: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-[18px] border p-[15px] text-left",
        "transition-[transform,background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]",
        active ? "border-primary/55 bg-primary/8" : "border-line bg-surface hover:bg-surface-2/60",
      )}
    >
      {mark}
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[16px] font-bold text-ink">{name}</span>
        <span className="mt-0.5 block truncate text-[12.5px] text-faint">{sub}</span>
      </span>
      <CheckMark active={active} />
    </button>
  );
}

function Mark({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="grid h-11 w-11 flex-none place-items-center rounded-[13px] font-mono text-[10px] font-bold text-white" style={{ background: color }}>
      {children}
    </span>
  );
}

/** `after` is where onboarding lands; `loginHref` where an unauthenticated
    visitor is bounced. The iOS app points both at /app so the flow never drops
    someone onto the web dashboard. `onDone` fires once the user leaves the
    Done screen; `seedFromStore` starts from what's already followed. */
export function SetupFlow({
  after = "/dashboard",
  loginHref = "/login",
  onDone,
  seedFromStore = false,
}: {
  after?: string;
  loginHref?: string;
  onDone?: () => void;
  seedFromStore?: boolean;
} = {}) {
  const router = useRouter();
  const store = usePreferences();

  // Setup sits behind the gate: bounce anyone who isn't signed in (or a guest).
  const ready = useAppReady();
  const authed = useIsAuthed();
  useEffect(() => {
    if (ready && !authed) router.replace(loginHref);
  }, [ready, authed, router, loginHref]);

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const [sports, setSports] = useState<SportId[]>(() => (seedFromStore ? store.sports : []));
  const [leagues, setLeagues] = useState<LeagueId[]>(() => (seedFromStore ? store.leagues : []));
  const [teams, setTeams] = useState<FollowedTeam[]>(() => (seedFromStore ? store.teams : []));
  const [players, setPlayers] = useState<FollowedPlayer[]>(() => (seedFromStore ? store.players : []));

  function toggleSport(s: SportId) {
    const next = sports.includes(s) ? sports.filter((x) => x !== s) : [...sports, s];
    setSports(next);
    setLeagues((prev) => prev.filter((l) => next.includes(LEAGUES[l].sport)));
  }
  function toggleLeague(l: LeagueId) {
    setLeagues((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  }
  function toggleTeam(t: FollowedTeam) {
    setTeams((prev) =>
      prev.some((x) => x.teamId === t.teamId && x.league === t.league)
        ? prev.filter((x) => !(x.teamId === t.teamId && x.league === t.league))
        : [...prev, { league: t.league, teamId: t.teamId, displayName: t.displayName, abbreviation: t.abbreviation, logo: t.logo, color: t.color }],
    );
  }
  function togglePlayer(p: FollowedPlayer) {
    setPlayers((prev) =>
      prev.some((x) => x.id === p.id)
        ? prev.filter((x) => x.id !== p.id)
        : [...prev, { league: p.league, id: p.id, fullName: p.fullName, teamAbbr: p.teamAbbr, headshot: p.headshot, position: p.position }],
    );
  }

  const availableLeagues = leaguesForSports(sports);
  const canContinue = step === 0 ? sports.length > 0 : step === 1 ? leagues.length > 0 : step === 2 ? teams.length > 0 : true;

  function goNext() {
    if (step === 0 && leagues.length === 0) setLeagues(leaguesForSports(sports));
    if (step === 1) setTeams((prev) => prev.filter((t) => leagues.includes(t.league)));
    if (step === 3) return finish();
    setStep((s) => Math.min(3, s + 1));
  }
  function goBack() {
    if (step === 0) return;
    setStep((s) => Math.max(0, s - 1));
  }

  // Save the picks now; only mark onboarding complete once the user leaves the
  // Done screen — otherwise /app's gate would swap this out before they see it.
  function finish() {
    store.setSports(sports);
    store.setLeagues(leagues);
    store.setTeams(teams.filter((t) => leagues.includes(t.league)));
    store.setPlayers(players.filter((p) => leagues.includes(p.league)));
    setDone(true);
  }
  function leave() {
    store.complete();
    onDone?.();
    router.replace(after);
  }
  function addMore() {
    setDone(false);
    setStep(2);
  }
  function useSample() {
    store.setSports(DEFAULT_PREFERENCES.sports);
    store.setLeagues(DEFAULT_PREFERENCES.leagues);
    store.setTeams(DEFAULT_PREFERENCES.teams);
    store.setPlayers(DEFAULT_PREFERENCES.players);
    leave();
  }

  if (done) {
    return <SetupDone teams={teams.filter((t) => leagues.includes(t.league))} players={players} leagues={leagues} onGo={leave} onAddMore={addMore} />;
  }

  const progress = ((step + 1) / STEPS.length) * 100;
  const selectedCount = step === 0 ? sports.length : step === 1 ? leagues.length : step === 2 ? teams.length : players.length;

  function stepContent(i: number) {
    if (i === 0)
      return (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {SPORT_ORDER.map((s) => (
            <PickRow key={s} active={sports.includes(s)} onToggle={() => toggleSport(s)} mark={<Mark color={SPORT_MARK[s]}><SportGlyph sport={s} /></Mark>} name={SPORTS[s].name} sub={SPORTS[s].leagues.map((l) => LEAGUES[l].name).join(" · ")} />
          ))}
        </div>
      );
    if (i === 1)
      return (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {availableLeagues.map((l) => {
            const meta = LEAGUES[l];
            return <PickRow key={l} active={leagues.includes(l)} onToggle={() => toggleLeague(l)} mark={<Mark color={LEAGUE_MARK[l]}>{LEAGUE_TAG[l]}</Mark>} name={meta.name} sub={`${meta.fullName} · ${meta.inSeason ? "In season" : meta.seasonHint}`} />;
          })}
        </div>
      );
    if (i === 2) return <TeamPicker leagues={leagues} selected={teams} onToggle={toggleTeam} />;
    return <PlayerPicker teams={teams} selected={players} onToggle={togglePlayer} />;
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex-none px-5" style={{ paddingTop: "max(28px, calc(env(safe-area-inset-top) + 20px))" }}>
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-[7px]">
              <Image src="/stadium-logo.png" alt="" width={22} height={22} className="h-[22px] w-[22px] rounded-[6px] object-cover" />
              <span className="font-display text-[14px] font-black leading-none tracking-[-0.02em] text-ink">
                FRONT<span className="text-primary">ROW</span>
              </span>
            </span>
            <button type="button" onClick={useSample} className="text-[13px] font-semibold text-faint transition-colors hover:text-ink">
              Use a sample lineup
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <span className="tnum font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-faint">
              Step {step + 1} / {STEPS.length}
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-bg-2">
              <div className="h-full rounded-full bg-primary transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <h1 className="mt-6 font-display text-[27px] font-black leading-[1.1] tracking-[-0.03em] text-ink">{STEPS[step].title}</h1>
          <p className="mt-2 text-[14px] leading-[1.5] text-muted">{STEPS[step].subtitle}</p>
        </div>
      </header>

      <SwipePager
        className="min-h-0 flex-1"
        index={step}
        count={STEPS.length}
        canSwipe={(dir) => (dir === -1 ? step > 0 : step < 3 && canContinue)}
        onSwipe={(dir) => (dir === 1 ? goNext() : goBack())}
        render={(i) => (
          <div className="no-scrollbar h-full overflow-y-auto px-5 pb-6 pt-[22px]">
            <div className="mx-auto max-w-2xl">{stepContent(i)}</div>
          </div>
        )}
      />

      <footer className="glass-bar flex-none px-5 pt-3.5" style={{ paddingBottom: "max(16px, calc(env(safe-area-inset-bottom) + 10px))" }}>
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            aria-label="Back"
            className={cn("glass grid h-12 w-12 flex-none place-items-center rounded-full text-[16px] text-muted transition-opacity active:scale-[0.97]", step === 0 && "pointer-events-none opacity-0")}
          >
            ←
          </button>
          <span className="tnum flex-1 text-[13px] text-faint">
            {selectedCount > 0 ? `${selectedCount} selected` : step === 3 ? "Optional" : "Choose at least one"}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={!canContinue}
            className={cn(
              "rounded-full px-[26px] py-[15px] text-[15px] font-bold transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
              canContinue ? "bg-primary text-primary-ink hover:bg-primary-bright active:scale-[0.97]" : "cursor-not-allowed bg-line text-faint",
            )}
          >
            {step === 3 ? "Finish setup" : "Continue"}
          </button>
        </div>
      </footer>
    </div>
  );
}
