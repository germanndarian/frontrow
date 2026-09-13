import { NextRequest, NextResponse } from "next/server";
import { LEAGUES } from "@/lib/leagues";
import { isValidId } from "@/lib/espn/ids";
import type { LeagueId } from "@/lib/types";
import { espnCached, fetchSchedule } from "@/lib/espn/client";
import { REVALIDATE } from "@/lib/espn/endpoints";
import { normalizeSchedule } from "@/lib/espn/normalize";
import { jsonCached } from "@/lib/espn/response";

const VALID = new Set(Object.keys(LEAGUES));

export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get("league");
  const teamId = req.nextUrl.searchParams.get("teamId");
  if (!league || !VALID.has(league) || !isValidId(teamId)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const l = league as LeagueId;

  try {
    // The raw schedule is far too big for the fetch cache, so cache it normalized.
    const cached = await espnCached(["schedule", l, teamId], REVALIDATE.team, async () =>
      normalizeSchedule(await fetchSchedule(l, teamId), l, teamId),
    );
    return jsonCached(cached);
  } catch {
    return NextResponse.json({ error: "schedule_failed" }, { status: 502 });
  }
}
