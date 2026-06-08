import { NextResponse } from "next/server";
import { LEAGUES } from "@/lib/leagues";
import type { LeagueId, PlayoffBracket } from "@/lib/types";
import { fetchBracket } from "@/lib/espn/bracket";

const VALID = new Set(Object.keys(LEAGUES));

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ league: string }> },
) {
  const { league } = await params;
  if (!VALID.has(league)) {
    return NextResponse.json({ error: "bad_league" }, { status: 400 });
  }
  try {
    const bracket = await fetchBracket(league as LeagueId);
    return NextResponse.json(bracket);
  } catch {
    // No bracket beats a 500 — the UI treats empty rounds as "no playoffs".
    const empty: PlayoffBracket = {
      league: league as LeagueId,
      name: LEAGUES[league as LeagueId].fullName,
      rounds: [],
    };
    return NextResponse.json(empty);
  }
}
