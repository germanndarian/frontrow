import { NextRequest, NextResponse } from "next/server";
import { LEAGUES } from "@/lib/leagues";
import type { Game, LeagueId } from "@/lib/types";
import { espnFetch } from "@/lib/espn/client";
import { espnUrl, REVALIDATE } from "@/lib/espn/endpoints";
import { normalizeScoreboard } from "@/lib/espn/normalize";
import type { RawScoreboard } from "@/lib/espn/raw";

const VALID = new Set(Object.keys(LEAGUES));

export async function GET(req: NextRequest) {
  const param = req.nextUrl.searchParams.get("leagues") ?? "";
  const leagues = param
    .split(",")
    .map((s) => s.trim())
    .filter((l): l is LeagueId => VALID.has(l));

  if (leagues.length === 0) return NextResponse.json([] as Game[]);

  // One bad league shouldn't blank the whole strip — keep the ones that work.
  const settled = await Promise.allSettled(
    leagues.map(async (l) => {
      const raw = await espnFetch<RawScoreboard>(espnUrl.scoreboard(l), REVALIDATE.scoreboard);
      return normalizeScoreboard(raw, l);
    }),
  );

  const games = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const allFailed = settled.every((r) => r.status === "rejected");
  if (allFailed) return NextResponse.json({ error: "scoreboard_failed" }, { status: 502 });

  return NextResponse.json(games);
}
