/**
 * ESPN ids arrive from the URL and are spliced straight into an upstream URL
 * and into a cache key. Both deserve a second look.
 *
 * The upstream host is a constant, so a crafted id can't reach anywhere but
 * ESPN — but it can still walk to a different ESPN path (`123/../../other`),
 * bolt a query string onto ours (`123?limit=1`), or mint an unbounded number
 * of distinct cache entries and push everything useful out of the cache.
 *
 * Every id the app actually uses is numeric — teams, athletes, the lot — so
 * that is what we take. Letters, dashes and underscores are allowed too, at
 * no cost, in case ESPN ever hands one out; slashes, dots, percent signs and
 * query characters are exactly what we're turning away.
 */
const ID = /^[A-Za-z0-9_-]{1,32}$/;

export function isValidId(id: string | null | undefined): id is string {
  return typeof id === "string" && ID.test(id);
}
