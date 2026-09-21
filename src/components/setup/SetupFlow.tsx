"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/lib/store";
import { useAppReady, useIsAuthed } from "@/lib/auth";
import { DEFAULT_PREFERENCES } from "@/lib/mock";
import { LEAGUES, leaguesForSports } from "@/lib/leagues";
import type { FollowedPlayer, FollowedTeam, LeagueId, SportId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SwipePager } from "@/components/mobile/SwipePager";
import { LeaguePicker, SportPicker } from "./SportLeaguePickers";
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
    if (i === 0) return <SportPicker selected={sports} onToggle={toggleSport} />;
    if (i === 1) return <LeaguePicker sports={sports} selected={leagues} onToggle={toggleLeague} />;
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
