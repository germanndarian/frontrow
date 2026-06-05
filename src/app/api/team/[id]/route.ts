import { NextRequest, NextResponse } from "next/server";
import { LEAGUES } from "@/lib/leagues";
import type { LeagueId } from "@/lib/types";
import { espnFetch, fetchSchedule } from "@/lib/espn/client";
import { espnUrl, REVALIDATE } from "@/lib/espn/endpoints";
import { normalizeTeamCard } from "@/lib/espn/normalize";
import type { RawTeamDetail } from "@/lib/espn/raw";

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
    const [detail, sched] = await Promise.all([
      espnFetch<RawTeamDetail>(espnUrl.team(l, id), REVALIDATE.team),
      // Schedule is supplementary (and has an off-season fallback) — never fatal.
      fetchSchedule(l, id, REVALIDATE.team),
    ]);
    return NextResponse.json(normalizeTeamCard(detail, sched, l));
  } catch {
    return NextResponse.json({ error: "team_failed" }, { status: 502 });
  }
}
