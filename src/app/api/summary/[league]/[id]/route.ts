import { NextResponse } from "next/server";
import { LEAGUES } from "@/lib/leagues";
import type { LeagueId } from "@/lib/types";
import { espnFetch } from "@/lib/espn/client";
import { espnUrl, REVALIDATE } from "@/lib/espn/endpoints";
import { normalizeSummary } from "@/lib/espn/normalize";
import type { RawSummary } from "@/lib/espn/raw";

const VALID = new Set(Object.keys(LEAGUES));

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ league: string; id: string }> },
) {
  const { league, id } = await params;
  if (!VALID.has(league)) {
    return NextResponse.json({ error: "bad_league" }, { status: 400 });
  }
  if (!id) {
    return NextResponse.json({ error: "bad_id" }, { status: 400 });
  }

  try {
    const raw = await espnFetch<RawSummary>(
      espnUrl.summary(league as LeagueId, id),
      REVALIDATE.summary,
    );
    return NextResponse.json(normalizeSummary(raw, league as LeagueId, id));
  } catch {
    return NextResponse.json({ error: "summary_failed" }, { status: 502 });
  }
}
