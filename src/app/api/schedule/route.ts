import { NextRequest, NextResponse } from "next/server";
import { LEAGUES } from "@/lib/leagues";
import type { LeagueId } from "@/lib/types";
import { fetchSchedule } from "@/lib/espn/client";
import { REVALIDATE } from "@/lib/espn/endpoints";
import { normalizeSchedule } from "@/lib/espn/normalize";

const VALID = new Set(Object.keys(LEAGUES));

export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get("league");
  const teamId = req.nextUrl.searchParams.get("teamId");
  if (!league || !VALID.has(league) || !teamId) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const l = league as LeagueId;

  try {
    const raw = await fetchSchedule(l, teamId, REVALIDATE.team);
    return NextResponse.json(normalizeSchedule(raw, l, teamId));
  } catch {
    return NextResponse.json({ error: "schedule_failed" }, { status: 502 });
  }
}
