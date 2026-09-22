"use client";

import type { FollowedPlayer } from "@/lib/types";
import { usePlayer } from "@/lib/queries";
import { bioRows, playerSubtitle } from "@/lib/players";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { SheetFrame } from "@/components/ui/SheetFrame";
import { Headshot } from "@/components/ui/Headshot";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { GameLogRows, StatGrid } from "@/components/mobile/PlayersTab";

/* Everything the feed has on one player: the full stat grid with labels, the
   whole game log, and the profile around the numbers. The iPhone app's player
   sheet. It reads the same query as the player's card, so it opens on the data
   the card already has.

   `follow` is what's drawn and `open` whether it's showing — kept apart so the
   player stays on screen while the sheet animates away. */

export function PlayerModal({
  open,
  follow,
  onClose,
}: {
  open: boolean;
  follow: FollowedPlayer | null;
  onClose: () => void;
}) {
  return (
    <Modal open={open && !!follow} onClose={onClose} labelledBy="player-sheet-title">
      {follow && <PlayerSheet follow={follow} onClose={onClose} />}
    </Modal>
  );
}

function PlayerSheet({ follow, onClose }: { follow: FollowedPlayer; onClose: () => void }) {
  const { data, isPending, isError, refetch } = usePlayer(follow.league, follow.id);
  const profile = bioRows(data?.bio);
  const empty = !!data && (data.placeholder || data.stats.length === 0);

  return (
    <SheetFrame
      titleId="player-sheet-title"
      title={follow.fullName}
      subtitle={data ? `${playerSubtitle(data)} · ${data.seasonLabel}` : follow.teamAbbr}
      tint={data?.color}
      // The follow carries the headshot, so the face is there from the first
      // frame rather than waiting on the stats.
      lead={<Headshot src={data?.headshot || follow.headshot} name={follow.fullName} color={data?.color} size={40} />}
      onClose={onClose}
      closeLabel="Close player"
      bodyClassName="space-y-4 bg-bg/50 p-4"
    >
      {isPending ? (
        <Skeleton className="h-64 w-full rounded-[14px]" />
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} message={`Couldn't load ${follow.fullName}.`} />
      ) : (
        <>
          {empty ? (
            <EmptyState title="No stats yet" body="Season stats and recent games appear here once the feed has them." />
          ) : (
            <>
              <StatGrid stats={data.stats} labels />
              {data.recent.entries.length > 0 && (
                <div>
                  <Eyebrow>
                    Last {data.recent.entries.length} · {data.recent.label}
                  </Eyebrow>
                  <GameLogRows entries={data.recent.entries} />
                </div>
              )}
            </>
          )}
          {profile.length > 0 && (
            <div>
              <Eyebrow>Profile</Eyebrow>
              <dl className="overflow-hidden rounded-[16px] border border-line bg-surface">
                {profile.map(([label, value], i) => (
                  <div key={label} className={cn("flex items-baseline gap-3 px-4 py-2.5", i > 0 && "border-t border-line-soft")}>
                    <dt className="w-[104px] shrink-0 text-[12.5px] text-faint">{label}</dt>
                    <dd className="min-w-0 flex-1 text-[13.5px] font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </>
      )}
    </SheetFrame>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">{children}</div>
  );
}
