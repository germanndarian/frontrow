import { NextRequest, NextResponse } from "next/server";
import { LEAGUES } from "@/lib/leagues";
import type { LeagueId } from "@/lib/types";
import { espnFetch } from "@/lib/espn/client";
import { espnUrl, REVALIDATE } from "@/lib/espn/endpoints";
import { normalizeRoster } from "@/lib/espn/normalize";
import type { RawRoster } from "@/lib/espn/raw";

const VALID = new Set(Object.keys(LEAGUES));

export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get("league");
  const teamId = req.nextUrl.searchParams.get("teamId");
  if (!league || !VALID.has(league) || !teamId) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const l = league as LeagueId;

  try {
    const raw = await espnFetch<RawRoster>(espnUrl.roster(l, teamId), REVALIDATE.roster);
    return NextResponse.json(normalizeRoster(raw, l));
  } catch {
    return NextResponse.json({ error: "roster_failed" }, { status: 502 });
  }
}
