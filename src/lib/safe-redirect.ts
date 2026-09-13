/**
 * Where to send someone after they confirm their email.
 *
 * The value is pasted onto our own origin and handed to a redirect, and
 * `new URL("https://frontrow.app" + "@evil.com")` is a URL whose host is
 * evil.com — so an unchecked `next` hands an attacker a freshly signed-in
 * user on their own doorstep. A path on this site is the whole of what we
 * accept: one leading slash, no second slash and no backslash, since both
 * spell an absolute URL to a browser once the origin is in front of them.
 */
export function safeNext(raw: string | null, fallback = "/dashboard"): string {
  if (!raw || !raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}
