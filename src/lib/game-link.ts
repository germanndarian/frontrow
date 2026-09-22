/* The open game lives in the address bar — `/dashboard?game=401856683` — so
   the address can be copied and shared, and loading it opens that game again.
   The website's version of the widget link on the phone.

   `history.replaceState` rather than a navigation: nothing reloads, no history
   entry piles up per game, and Next.js keeps `useSearchParams` in step with it. */

export const GAME_PARAM = "game";

export function setGameParam(id: string | null): void {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set(GAME_PARAM, id);
  else url.searchParams.delete(GAME_PARAM);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}
