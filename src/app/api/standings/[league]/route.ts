import { NextRequest, NextResponse } from "next/server";
import { LEAGUES } from "@/lib/leagues";
import type { LeagueId } from "@/lib/types";
import { espnFetch } from "@/lib/espn/client";
import { espnUrl, REVALIDATE } from "@/lib/espn/endpoints";
import { normalizeStandings } from "@/lib/espn/normalize";
import type { RawStandings } from "@/lib/espn/raw";

const VALID = new Set(Object.keys(LEAGUES));

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ league: string }> },
) {
  const { league } = await params;
  if (!VALID.has(league)) {
    return NextResponse.json({ error: "bad_league" }, { status: 400 });
  }
  const teamId = req.nextUrl.searchParams.get("teamId") ?? undefined;

  try {
    const raw = await espnFetch<RawStandings>(
      espnUrl.standings(league as LeagueId),
      REVALIDATE.standings,
    );
    const group = normalizeStandings(raw, league as LeagueId, teamId);
    if (!group) return NextResponse.json({ error: "no_standings" }, { status: 404 });
    return NextResponse.json(group);
  } catch {
    return NextResponse.json({ error: "standings_failed" }, { status: 502 });
  }
}
