import { NextRequest, NextResponse } from "next/server";
import { LEAGUES } from "@/lib/leagues";
import type { LeagueId } from "@/lib/types";
import { espnFetch } from "@/lib/espn/client";
import { espnUrl, REVALIDATE } from "@/lib/espn/endpoints";
import { normalizePlayer } from "@/lib/espn/normalize";
import type { RawAthlete, RawGamelog } from "@/lib/espn/raw";

const VALID = new Set(Object.keys(LEAGUES));

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const league = req.nextUrl.searchParams.get("league");
  if (!league || !VALID.has(league)) {
    return NextResponse.json({ error: "bad_league" }, { status: 400 });
  }
  const l = league as LeagueId;

  try {
    const [athlete, gamelog] = await Promise.all([
      espnFetch<RawAthlete>(espnUrl.athlete(l, id), REVALIDATE.player),
      // Game log is supplementary — season stats still render without it.
      espnFetch<RawGamelog>(espnUrl.gamelog(l, id), REVALIDATE.player).catch(
        () => ({}) as RawGamelog,
      ),
    ]);
    return NextResponse.json(normalizePlayer(athlete, gamelog, l));
  } catch {
    return NextResponse.json({ error: "player_failed" }, { status: 502 });
  }
}
