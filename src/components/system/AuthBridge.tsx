"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

/**
 * Boots the Supabase auth listener once on mount: it restores an existing
 * session, loads the user's follows + settings into the stores, and wires
 * write-through persistence. Renders nothing.
 */
export function AuthBridge() {
  useEffect(() => {
    useAuth.getState().init();
  }, []);

  return null;
}
