import type { Game } from "@/lib/types";
import { periodCount, periodLabel, periodValue, totalLabel } from "@/lib/game-detail";

/** The line score: a column per period, as many as either side has reached,
    and the running total. */
export function LineScore({ game }: { game: Game }) {
  const total = periodCount(game);
  const columns = Array.from({ length: total }, (_, i) => i);

  return (
    <div className="no-scrollbar overflow-x-auto rounded-[16px] border border-line bg-surface">
      <table className="w-full border-collapse font-mono" aria-label="Line score">
        <thead>
          <tr className="text-[10.5px] font-bold tracking-[0.05em] text-faint">
            <th scope="col" className="w-[52px] py-2.5 pl-4 pr-1 text-left">
              <span className="sr-only">Team</span>
            </th>
            {columns.map((i) => (
              <th key={i} scope="col" className="px-1 py-2.5 text-center">
                {periodLabel(game.league, i)}
              </th>
            ))}
            <th scope="col" className="w-[40px] py-2.5 pl-1 pr-4 text-center">
              {totalLabel(game.league)}
            </th>
          </tr>
        </thead>
        <tbody>
          {[game.away, game.home].map((side, row) => (
            <tr key={row} className="border-t border-line-soft">
              <th scope="row" className="py-2 pl-4 pr-1 text-left text-[12.5px] font-bold text-ink">
                {side.abbreviation}
              </th>
              {columns.map((i) => (
                <td key={i} className="tnum px-1 py-2 text-center text-[13px] text-muted">
                  {periodValue(side, i)}
                </td>
              ))}
              <td className="tnum py-2 pl-1 pr-4 text-center text-[13.5px] font-bold text-ink">
                {side.score ?? 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
