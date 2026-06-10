"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePreferences, useHasHydrated } from "@/lib/store";
import { useCurrentUser } from "@/lib/auth";
import { useSettings, type SectionId } from "@/lib/settings";
import { useScoreboard } from "@/lib/queries";
import { LEAGUES } from "@/lib/leagues";
import type { FollowedTeam } from "@/lib/types";
import { AppHeader } from "./AppHeader";
import { Section } from "./Section";
import { LeagueFilter, type LeagueFilterValue } from "./LeagueFilter";
import { ScoreboardStrip } from "./ScoreboardStrip";
import { TeamCardView } from "./TeamCardView";
import { PlayerCardView } from "./PlayerCardView";
import { StandingsCard } from "./StandingsCard";
import { SeasonTrendCard } from "./SeasonTrendCard";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { ShaderBackdrop } from "@/components/system/ShaderBackdrop";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function DashboardLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-7 sm:px-6">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-44" />
      </div>
      <div className="no-scrollbar mb-10 flex gap-3 overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[148px] w-[270px] shrink-0 rounded-md" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-52 w-full rounded-lg" />
        ))}
      </div>
    </main>
  );
}

export function Dashboard() {
  const hydrated = useHasHydrated();
  const { teams, players, leagues } = usePreferences();
  const greetingName = useSettings((s) => s.greetingName);
  const user = useCurrentUser();
  // A custom greeting name wins; otherwise greet by the account's display name.
  const name = greetingName.trim() || user?.displayName?.trim() || "";
  const hiddenSections = useSettings((s) => s.hiddenSections);
  const isHidden = (id: SectionId) => hiddenSections.includes(id);

  // Seed the league filter from the user's saved default, but only honor it if
  // they actually follow that league — otherwise fall back to "All".
  const [selected, setSelected] = useState<LeagueFilterValue>(() => {
    const pref = useSettings.getState().defaultLeague;
    const followed = usePreferences.getState().leagues;
    return pref !== "all" && followed.includes(pref) ? pref : "all";
  });

  // Shared scoreboard query (header live count + strip read the same cache).
  const scoreboard = useScoreboard(leagues);
  const liveCount =
    scoreboard.data?.filter((g) => g.state === "in").length ?? 0;

  const followedKeys = useMemo(
    () => new Set(teams.map((t) => `${t.league}:${t.teamId}`)),
    [teams],
  );

  const visibleLeagues = useMemo(
    () => (selected === "all" ? leagues : leagues.filter((l) => l === selected)),
    [selected, leagues],
  );

  const shownTeams = useMemo(
    () => teams.filter((t) => selected === "all" || t.league === selected),
    [teams, selected],
  );
  const shownPlayers = useMemo(
    () => players.filter((p) => selected === "all" || p.league === selected),
    [players, selected],
  );

  // The team featured in Season Stats. Defaults to the first in-season followed
  // team; clicking a team card overrides it. Falls back if the selection isn't
  // in the currently filtered view so the highlighted card always matches.
  const [selectedTeamKey, setSelectedTeamKey] = useState<string | null>(null);
  const spotlightTeam: FollowedTeam | undefined = useMemo(() => {
    return (
      shownTeams.find((t) => `${t.league}:${t.teamId}` === selectedTeamKey) ??
      shownTeams.find((t) => LEAGUES[t.league].inSeason) ??
      shownTeams[0]
    );
  }, [shownTeams, selectedTeamKey]);
  const spotlightKey = spotlightTeam
    ? `${spotlightTeam.league}:${spotlightTeam.teamId}`
    : null;

  if (!hydrated) {
    return (
      <>
        <ShaderBackdrop />
        <AppHeader liveCount={0} />
        <DashboardLoading />
      </>
    );
  }

  const nothingFollowed = teams.length === 0 && players.length === 0;

  return (
    <>
      <ShaderBackdrop />
      <AppHeader liveCount={liveCount} />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-7 sm:px-6">
        {/* Hero */}
        <div className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-[28px] font-extrabold leading-none tracking-[-0.02em] text-ink sm:text-[34px]">
              {greeting()}
              {name ? `, ${name}` : ""}.
            </h1>
            <p className="mt-2 text-[14px] text-muted">
              {liveCount > 0 ? (
                <>
                  <span className="font-semibold text-live">{liveCount} game{liveCount === 1 ? "" : "s"} live</span>{" "}
                  across the teams you follow.
                </>
              ) : (
                <>Here&apos;s what&apos;s happening across the teams you follow.</>
              )}
            </p>
          </div>
          {leagues.length > 1 && (
            <LeagueFilter leagues={leagues} value={selected} onChange={setSelected} />
          )}
        </div>

        {nothingFollowed ? (
          <Card>
            <EmptyState
              title="You're not following anyone yet"
              body="Add your favorite teams and players to build your dashboard."
              action={
                <Link
                  href="/settings"
                  className="rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-ink transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-primary-bright active:scale-[0.97]"
                >
                  Go to settings
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="space-y-10">
            {/* Live & upcoming */}
            {!isHidden("scoreboard") && (
              <Section title="Live & Upcoming" className="rise">
                <ScoreboardStrip
                  leagues={leagues}
                  only={selected === "all" ? undefined : selected}
                  followedKeys={followedKeys}
                />
              </Section>
            )}

            {/* Teams */}
            {!isHidden("teams") && shownTeams.length > 0 && (
              <Section
                title="Your Teams"
                count={shownTeams.length}
                className="rise"
                action={
                  shownTeams.length > 1 ? (
                    <span className="hidden text-[12px] text-faint sm:inline">
                      Tap a team to feature it below ↓
                    </span>
                  ) : undefined
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {shownTeams.map((t) => {
                    const key = `${t.league}:${t.teamId}`;
                    return (
                      <TeamCardView
                        key={key}
                        follow={t}
                        selected={key === spotlightKey}
                        onSelect={() => setSelectedTeamKey(key)}
                      />
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Season trend (chart) — driven by the selected team */}
            {!isHidden("trend") && spotlightTeam && (
              <Section title="Season Stats" className="rise">
                <SeasonTrendCard follow={spotlightTeam} />
              </Section>
            )}

            {/* Players */}
            {!isHidden("players") && shownPlayers.length > 0 && (
              <Section title="Your Players" count={shownPlayers.length} className="rise">
                <div className="grid gap-4 sm:grid-cols-2">
                  {shownPlayers.map((p) => (
                    <PlayerCardView key={p.id} follow={p} />
                  ))}
                </div>
              </Section>
            )}

            {/* Standings */}
            {!isHidden("standings") && visibleLeagues.length > 0 && (
              <Section title="Around the League" id="standings" className="rise">
                <div className="grid gap-4 lg:grid-cols-2">
                  {visibleLeagues.map((l) => (
                    <StandingsCard
                      key={l}
                      league={l}
                      teamId={teams.find((t) => t.league === l)?.teamId}
                    />
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}

        <footer className="mt-16 border-t border-line-soft/60 pt-6 text-[12px] text-faint">
          Frontrow · live scores and stats via ESPN&apos;s public endpoints. Unofficial
          data, refreshed as games unfold.
        </footer>
      </main>
    </>
  );
}
