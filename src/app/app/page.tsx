"use client";

import { useState } from "react";
import { usePreferences } from "@/lib/store";
import { useAppReady, useAuth, useIsAuthed } from "@/lib/auth";
import { SetupFlow } from "@/components/setup/SetupFlow";
import { Wordmark } from "@/components/brand/Wordmark";
import { Spinner } from "@/components/ui/States";
import { Welcome } from "@/components/mobile/Welcome";
import { Login } from "@/components/mobile/Login";
import { MobileShell } from "@/components/mobile/MobileShell";

/* /app — what the iOS shell loads. One route, four screens:

     welcome ─▶ login ─▶ setup ─▶ the app (five tabs)

   The gate mirrors /dashboard's: hold a splash until auth is known, then
   route on status and onboarding. Signing in flips the auth store, which is
   what advances the flow — no redirects, so nothing here can bounce a user
   onto the web dashboard. There is no Home button and the only way out is
   Sign out in Settings, so a login lasts until the user ends it. */

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg">
      <div className="flex flex-col items-center gap-5">
        <Wordmark />
        <Spinner className="!h-5 !w-5" />
      </div>
    </div>
  );
}

export default function AppPage() {
  const ready = useAppReady();
  const authed = useIsAuthed();
  const onboarded = usePreferences((s) => s.onboarded);
  const continueAsGuest = useAuth((s) => s.continueAsGuest);
  const [screen, setScreen] = useState<"welcome" | "login">("welcome");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  // Re-running onboarding from Settings ("Edit" / "+ Add") without clearing follows.
  const [editing, setEditing] = useState(false);

  if (!ready) return <Splash />;

  if (!authed) {
    if (screen === "login") {
      return <Login mode={mode} onMode={setMode} onBack={() => setScreen("welcome")} onGuest={continueAsGuest} />;
    }
    return (
      <Welcome
        onSignup={() => { setMode("signup"); setScreen("login"); }}
        onSignin={() => { setMode("signin"); setScreen("login"); }}
        onGuest={continueAsGuest}
      />
    );
  }

  if (!onboarded || editing) {
    return <SetupFlow after="/app" loginHref="/app" seedFromStore={editing} onDone={() => setEditing(false)} />;
  }

  return <MobileShell onEditFollows={() => setEditing(true)} />;
}
