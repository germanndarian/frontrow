"use client";

import Image from "next/image";
import { useCurrentUser } from "@/lib/auth";
import { useSettings } from "@/lib/settings";
import { useTeamSlate } from "@/lib/queries";
import { LEAGUES, LEAGUE_ORDER } from "@/lib/leagues";
import type { FollowedPlayer, FollowedTeam, LeagueId } from "@/lib/types";

/* The confirmation screen at the end of onboarding: what was picked, how many
   of their games are live right now, and two ways out. Dark and branded
   regardless of theme, like the welcome screen — so its palette is inline. */

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const count = (n: number) => (n < WORDS.length ? WORDS[n] : String(n));
const plural = (n: number, one: string, many: string) => `${count(n)} ${n === 1 ? one : many}`;

function Row({ n, label, detail, first }: { n: number; label: string; detail: string; first?: boolean }) {
  return (
    <div className={first ? "flex items-center gap-3 py-3.5" : "flex items-center gap-3 border-t border-white/8 py-3.5"}>
      <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] bg-white/10 font-mono text-[9px] font-bold text-[#7fa9f0]">{n}</span>
      <span className="flex-1 text-[13.5px] font-semibold text-white">{label}</span>
      <span className="truncate font-mono text-[12px] text-white/55">{detail}</span>
    </div>
  );
}

export function SetupDone({
  teams,
  players,
  leagues,
  onGo,
  onAddMore,
}: {
  teams: FollowedTeam[];
  players: FollowedPlayer[];
  leagues: LeagueId[];
  onGo: () => void;
  onAddMore: () => void;
}) {
  const profile = useCurrentUser();
  const greeting = useSettings((s) => s.greetingName);
  const name = (greeting || profile?.displayName || "").trim().split(/\s+/)[0];
  const { liveCount } = useTeamSlate(teams);

  const summary = `${plural(teams.length, "team", "teams")}, ${plural(players.length, "player", "players").toLowerCase()} and ${plural(leagues.length, "league", "leagues").toLowerCase()} are on your dashboard.`;
  const live = liveCount > 0 ? ` ${plural(liveCount, "game is", "games are")} live right now.` : "";
  const leagueNames = LEAGUE_ORDER.filter((l) => leagues.includes(l)).map((l) => LEAGUES[l].name).join(" ");
  const playerNames = players.map((p) => p.fullName.trim().split(/\s+/).pop()).join(", ");

  return (
    <div
      className="flex min-h-dvh flex-col bg-[#0f1622] text-white"
      style={{ backgroundImage: "radial-gradient(44rem 30rem at 50% -8%, oklch(.68 .16 257/.42), transparent 62%)" }}
    >
      <div className="flex items-center gap-[9px] px-6" style={{ paddingTop: "max(56px, calc(env(safe-area-inset-top) + 20px))" }}>
        <Image src="/stadium-logo.png" alt="" width={28} height={28} className="h-7 w-7 rounded-[8px] object-cover" />
        <span className="font-display text-[17px] font-black leading-none tracking-[-0.02em]">
          FRONT<span className="text-[#7fa9f0]">ROW</span>
        </span>
      </div>

      <div className="px-6 pt-14">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-[26px] font-bold text-white">✓</span>
        <h1 className="mt-[26px] font-display text-[38px] font-black leading-[1.02] tracking-[-0.035em]">
          You&apos;re all set{name ? "," : "."}
          {name && (
            <>
              <br />
              {name}.
            </>
          )}
        </h1>
        <p className="mt-4 max-w-[30ch] text-[15px] leading-[1.55] text-white/60">
          {summary}
          {live}
        </p>
      </div>

      <div className="mx-6 mt-[30px] rounded-[20px] border border-white/12 bg-white/6 px-4 py-1">
        <Row n={teams.length} label="Teams followed" detail={teams.map((t) => t.abbreviation).join(" ") || "—"} first />
        <Row n={players.length} label="Players starred" detail={playerNames || "—"} />
        <Row n={leagues.length} label="Leagues" detail={leagueNames || "—"} />
      </div>
      <p className="mx-6 mt-5 text-[12px] leading-[1.5] text-white/55">Change any of this later in Settings.</p>

      <div className="min-h-5 flex-1" />

      <div className="flex flex-col gap-2.5 px-6 pt-[22px]" style={{ paddingBottom: "max(30px, calc(env(safe-area-inset-bottom) + 14px))" }}>
        <button type="button" onClick={onGo} className="w-full rounded-full bg-primary py-[15px] text-[15px] font-bold text-white active:scale-[0.98]">
          Go to my dashboard
        </button>
        <button type="button" onClick={onAddMore} className="w-full rounded-full border border-white/22 bg-white/6 py-[15px] text-[15px] font-semibold text-white active:scale-[0.98]">
          Add more teams
        </button>
      </div>
    </div>
  );
}
