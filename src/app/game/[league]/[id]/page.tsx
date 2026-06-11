"use client";

import { use, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import { LEAGUES } from "@/lib/leagues";
import type { LeagueId } from "@/lib/types";
import { useAppReady, useIsAuthed } from "@/lib/auth";
import { GameCenter } from "@/components/game/GameCenter";
import { Wordmark } from "@/components/brand/Wordmark";
import { Spinner } from "@/components/ui/States";

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="flex flex-col items-center gap-5">
        <Wordmark />
        <Spinner className="!h-5 !w-5" />
      </div>
    </div>
  );
}

export default function GamePage({
  params,
}: {
  params: Promise<{ league: string; id: string }>;
}) {
  const { league, id } = use(params);
  const ready = useAppReady();
  const authed = useIsAuthed();
  const router = useRouter();

  const valid = league in LEAGUES;

  useEffect(() => {
    if (ready && !authed) router.replace("/login");
  }, [ready, authed, router]);

  // Unknown league in the URL — there's no game to show.
  if (!valid) notFound();

  // Hold a branded splash until auth resolves, like the dashboard, so a
  // deep-linked, signed-in user never flashes the login screen.
  if (!ready || !authed) return <Splash />;

  return <GameCenter league={league as LeagueId} id={id} />;
}
