"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { usePreferences } from "@/lib/store";
import { useAppReady, useIsAuthed } from "@/lib/auth";
import { DEFAULT_PREFERENCES } from "@/lib/mock";
import { LEAGUES, SPORTS, SPORT_ORDER, leaguesForSports } from "@/lib/leagues";
import type {
  FollowedPlayer,
  FollowedTeam,
  LeagueId,
  SportId,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/brand/Wordmark";
import { CheckMark } from "./CheckMark";
import { TeamPicker } from "./TeamPicker";
import { PlayerPicker } from "./PlayerPicker";

const STEPS = [
  { title: "Pick your sports", subtitle: "Choose everything you follow. You can add more later." },
  { title: "Choose your leagues", subtitle: "We pre-selected the obvious ones — adjust as you like." },
  { title: "Follow your teams", subtitle: "Search and tap the teams you want on your dashboard." },
  { title: "Star your players", subtitle: "Optional. Add the names you tune in for." },
] as const;

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
  return (
    <svg {...common}>
      <ellipse cx="12" cy="15" rx="8" ry="3" />
      <path d="M4 12.5v2.5M20 12.5v2.5M12 12v6" strokeWidth="1.4" opacity="0.5" />
      <ellipse cx="12" cy="12" rx="8" ry="3" />
    </svg>
  );
}

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 26 : -26 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -26 : 26 }),
};

export function SetupFlow() {
  const router = useRouter();
  const store = usePreferences();

  // Setup sits behind the gate: bounce anyone who isn't signed in (or a guest).
  const ready = useAppReady();
  const authed = useIsAuthed();
  useEffect(() => {
    if (ready && !authed) router.replace("/login");
  }, [ready, authed, router]);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [sports, setSports] = useState<SportId[]>([]);
  const [leagues, setLeagues] = useState<LeagueId[]>([]);
  const [teams, setTeams] = useState<FollowedTeam[]>([]);
  const [players, setPlayers] = useState<FollowedPlayer[]>([]);

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
  const canContinue =
    step === 0 ? sports.length > 0 : step === 1 ? leagues.length > 0 : step === 2 ? teams.length > 0 : true;

  function goNext() {
    if (step === 0 && leagues.length === 0) setLeagues(leaguesForSports(sports));
    if (step === 1) setTeams((prev) => prev.filter((t) => leagues.includes(t.league)));
    if (step === 3) return finish();
    setDirection(1);
    setStep((s) => Math.min(3, s + 1));
  }
  function goBack() {
    if (step === 0) return;
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  }

  function finish() {
    store.setSports(sports);
    store.setLeagues(leagues);
    store.setTeams(teams.filter((t) => leagues.includes(t.league)));
    store.setPlayers(players.filter((p) => leagues.includes(p.league)));
    store.complete();
    router.replace("/");
  }

  function useSample() {
    store.setSports(DEFAULT_PREFERENCES.sports);
    store.setLeagues(DEFAULT_PREFERENCES.leagues);
    store.setTeams(DEFAULT_PREFERENCES.teams);
    store.setPlayers(DEFAULT_PREFERENCES.players);
    store.complete();
    router.replace("/");
  }

  const progress = ((step + 1) / STEPS.length) * 100;
  const selectedCount =
    step === 0 ? sports.length : step === 1 ? leagues.length : step === 2 ? teams.length : players.length;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 pt-5 sm:px-8">
        <Wordmark />
        <button
          onClick={useSample}
          className="text-[13px] font-semibold text-faint transition-colors hover:text-ink"
        >
          Use a sample lineup
        </button>
      </header>

      {/* Progress */}
      <div className="mt-5 px-4 sm:px-8">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <span className="tnum text-[11px] font-bold uppercase tracking-[0.14em] text-faint">
            Step {step + 1} / {STEPS.length}
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step content */}
      <main className="flex flex-1 justify-center px-4 pb-32 pt-8 sm:px-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="font-display text-[26px] font-extrabold tracking-[-0.02em] text-ink sm:text-[30px]">
                {STEPS[step].title}
              </h1>
              <p className="mb-6 mt-1.5 text-[14px] text-muted">{STEPS[step].subtitle}</p>

              {step === 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {SPORT_ORDER.map((s) => {
                    const active = sports.includes(s);
                    const subs = SPORTS[s].leagues.map((l) => LEAGUES[l].name).join(" · ");
                    return (
                      <button
                        key={s}
                        onClick={() => toggleSport(s)}
                        aria-pressed={active}
                        className={cn(
                          "relative flex items-center gap-3 rounded-lg border p-4 text-left sm:flex-col sm:items-start sm:gap-6",
                          "transition-[transform,background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]",
                          active ? "border-primary/60 bg-primary/[0.1]" : "border-line/70 bg-surface/50 hover:border-line hover:bg-surface-2/60",
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors",
                            active ? "border-primary/40 bg-primary/15 text-primary-bright" : "border-line/70 bg-bg-2/60 text-muted",
                          )}
                        >
                          <SportGlyph sport={s} />
                        </span>
                        <span className="flex-1 sm:flex-none">
                          <span className="block font-display text-[16px] font-bold text-ink">{SPORTS[s].name}</span>
                          <span className="block text-[12px] text-faint">{subs}</span>
                        </span>
                        <span className="absolute right-3 top-3">
                          <CheckMark active={active} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 1 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {availableLeagues.map((l) => {
                    const meta = LEAGUES[l];
                    const active = leagues.includes(l);
                    return (
                      <button
                        key={l}
                        onClick={() => toggleLeague(l)}
                        aria-pressed={active}
                        className={cn(
                          "relative flex items-center gap-3 rounded-lg border p-4 text-left",
                          "transition-[transform,background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]",
                          active ? "border-primary/60 bg-primary/[0.1]" : "border-line/70 bg-surface/50 hover:border-line hover:bg-surface-2/60",
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block font-display text-[16px] font-bold text-ink">{meta.name}</span>
                          <span className="block truncate text-[12.5px] text-faint">{meta.fullName}</span>
                          <span
                            className={cn(
                              "mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                              meta.inSeason ? "bg-win/14 text-win" : "bg-surface-2 text-faint",
                            )}
                          >
                            {meta.inSeason ? "In season" : meta.seasonHint}
                          </span>
                        </span>
                        <CheckMark active={active} />
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 2 && (
                <TeamPicker leagues={leagues} selected={teams} onToggle={toggleTeam} />
              )}

              {step === 3 && (
                <PlayerPicker
                  teams={teams}
                  selected={players}
                  onToggle={togglePlayer}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer nav */}
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-line/60 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3.5 sm:px-8">
          <button
            onClick={goBack}
            disabled={step === 0}
            className={cn(
              "rounded-full px-4 py-2 text-[13.5px] font-semibold transition-[transform,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]",
              step === 0 ? "pointer-events-none opacity-0" : "text-muted hover:text-ink",
            )}
          >
            Back
          </button>

          <div className="flex items-center gap-3">
            <span className="tnum text-[12.5px] text-faint">
              {selectedCount > 0
                ? `${selectedCount} selected`
                : step === 3
                  ? "Optional"
                  : "Choose at least one"}
            </span>
            <button
              onClick={goNext}
              disabled={!canContinue}
              className={cn(
                "rounded-full px-5 py-2.5 text-[13.5px] font-bold transition-[transform,background-color,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                canContinue
                  ? "bg-primary text-primary-ink hover:bg-primary-bright active:scale-[0.97]"
                  : "cursor-not-allowed bg-surface-2 text-faint",
              )}
            >
              {step === 3 ? "Finish setup" : "Continue"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
