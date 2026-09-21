"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Game } from "./types";

/* Games pinned to the front of their row in a league's view.

   Kept in this browser rather than synced to the account, the way the phone
   keeps them on the device. A pin is about the next few hours — the game you're
   half-watching while the board refreshes around it — and means nothing once
   it's over. Syncing it would need a column, a migration and a merge rule for
   something nobody would miss on their other screen.

   A pinned game is let go as soon as a board shows it final, so a season's worth
   doesn't pile up in storage. If the browser won't store anything (some private
   modes), pins last until the tab closes. */

interface PinState {
  ids: string[];
  toggle: (id: string) => void;
  /** Drop the pins of any of these games that have finished. */
  forgetFinished: (games: Game[]) => void;
}

export const usePins = create<PinState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id] })),
      forgetFinished: (games) =>
        set((s) => {
          const finished = new Set(games.filter((g) => g.state === "post").map((g) => g.id));
          const kept = s.ids.filter((id) => !finished.has(id));
          return kept.length === s.ids.length ? s : { ids: kept };
        }),
    }),
    {
      name: "frontrow.pinnedGames",
      storage: createJSONStorage(() => {
        // No storage at all (some private modes, the server): keep pins in memory.
        if (typeof localStorage === "undefined" || !localStorage) throw new Error("No storage");
        return localStorage;
      }),
      partialize: (s) => ({ ids: s.ids }),
    },
  ),
);
