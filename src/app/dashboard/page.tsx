"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/lib/store";
import { useAppReady, useIsAuthed } from "@/lib/auth";
import { Dashboard } from "@/components/dashboard/Dashboard";
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

export default function DashboardPage() {
  const ready = useAppReady();
  const authed = useIsAuthed();
  const onboarded = usePreferences((s) => s.onboarded);
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!authed) router.replace("/login");
    else if (!onboarded) router.replace("/setup");
  }, [ready, authed, onboarded, router]);

  // Hold a branded splash until we know whether to show login, setup or the
  // dashboard — so a returning, signed-in user never flashes the wrong screen.
  if (!ready || !authed || !onboarded) return <Splash />;

  return <Dashboard />;
}
