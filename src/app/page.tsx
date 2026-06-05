"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePreferences, useHasHydrated } from "@/lib/store";
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

export default function Home() {
  const hydrated = useHasHydrated();
  const onboarded = usePreferences((s) => s.onboarded);
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !onboarded) router.replace("/setup");
  }, [hydrated, onboarded, router]);

  // Hold a branded splash until we know whether to show setup or the dashboard.
  if (!hydrated || !onboarded) return <Splash />;

  return <Dashboard />;
}
