import type { NextConfig } from "next";

/**
 * Content Security Policy.
 *
 * Scripts are `'unsafe-inline'` rather than nonce-based, and that is a
 * deliberate trade rather than an oversight. A nonce has to be minted per
 * request, which means every page renders dynamically — this app's pages are
 * static today, and paying for that everywhere buys little here: the only
 * inline script we ship is a fixed string (the first-paint theme switch in
 * layout.tsx), and nothing in the app writes user input into HTML, so there
 * is no injection point for the nonce to close. What the rest of the policy
 * does buy is real: no framing, no plugins, no rewriting our base href, no
 * posting our forms to someone else's server, and scripts only from our own
 * origin.
 *
 * Everything listed below is somewhere the app genuinely talks to:
 *   - a.espncdn.com — every team logo and player headshot
 *   - *.supabase.co — auth and the follows/settings rows, over HTTP and
 *     websocket
 * Adding a host here is the price of loading from it; leaving one out breaks
 * that surface, so this list is derived from the built pages, not guessed.
 */
const csp = [
  "default-src 'self'",
  // React needs eval in development for its error overlay; production doesn't.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://a.espncdn.com https://*.espncdn.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com",
  "media-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

/** Applied to every response, HTML and API alike. */
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Belt and braces with frame-ancestors, for anything that predates CSP.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing here needs a camera, a microphone or your coordinates.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // Two years, subdomains included. Vercel serves HTTPS only, so nothing is
  // locked out by this that wasn't already unreachable.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  // Source maps stay off in production: they hand a reader the original
  // sources, and this is the default rather than something we rely on.
  productionBrowserSourceMaps: false,
  // The header Next sends by default names the framework and version, which
  // is free reconnaissance for anyone scanning for a known advisory.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
