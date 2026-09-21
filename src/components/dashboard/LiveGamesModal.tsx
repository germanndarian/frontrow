"use client";

import type { Game } from "@/lib/types";
import { useFreshGame } from "@/lib/queries";
import { Modal } from "@/components/ui/Modal";
import { SheetFrame } from "@/components/ui/SheetFrame";
import { GameCard } from "./GameCard";

/* When more than one of your games is on at once: pick which to watch.
   Picking one swaps this list for that game's sheet. */

const NONE = new Set<string>();

export function LiveGamesModal({
  open,
  games,
  onPick,
  onClose,
}: {
  open: boolean;
  games: Game[];
  onPick: (game: Game) => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="live-games-title">
      <SheetFrame
        titleId="live-games-title"
        title="Live now"
        subtitle={`${games.length} ${games.length === 1 ? "game" : "games"}`}
        onClose={onClose}
        closeLabel="Close live games"
        bodyClassName="bg-bg/50 p-4"
      >
        <div className="flex flex-col gap-3">
          {games.map((g) => (
            <LiveCard key={g.id} game={g} onPick={onPick} />
          ))}
        </div>
      </SheetFrame>
    </Modal>
  );
}

/** A card that keeps up with the board's refresh while the list is open. */
function LiveCard({ game, onPick }: { game: Game; onPick: (game: Game) => void }) {
  const fresh = useFreshGame(game.id, game) ?? game;
  // Every game here is one of yours, so nothing needs marking as yours.
  return <GameCard game={fresh} followedKeys={NONE} onOpen={onPick} className="w-full" />;
}
