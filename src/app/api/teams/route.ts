import { NextRequest, NextResponse } from "next/server";
import { LEAGUES } from "@/lib/leagues";
import type { LeagueId } from "@/lib/types";
import type { CatalogTeam } from "@/lib/catalog";
import { espnFetch } from "@/lib/espn/client";
import { espnUrl, REVALIDATE } from "@/lib/espn/endpoints";
import { normalizeTeams } from "@/lib/espn/normalize";
import type { RawTeamsList } from "@/lib/espn/raw";

const VALID = new Set(Object.keys(LEAGUES));

export async function GET(req: NextRequest) {
  const param = req.nextUrl.searchParams.get("leagues") ?? "";
  const leagues = param
    .split(",")
    .map((s) => s.trim())
    .filter((l): l is LeagueId => VALID.has(l));

  if (leagues.length === 0) return NextResponse.json([] as CatalogTeam[]);

  const settled = await Promise.allSettled(
    leagues.map(async (l) => {
      const raw = await espnFetch<RawTeamsList>(espnUrl.teams(l), REVALIDATE.teams);
      return normalizeTeams(raw, l);
    }),
  );

  const teams = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  if (teams.length === 0 && settled.every((r) => r.status === "rejected")) {
    return NextResponse.json({ error: "teams_failed" }, { status: 502 });
  }
  return NextResponse.json(teams);
}
