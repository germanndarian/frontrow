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
  /* Everything we serve is https in production, so this costs nothing there and
     closes a mixed-content hole if anything ever isn't.

     It is dropped for the browser-test build, which is the same production
     build served over plain http on localhost. Chromium treats 127.0.0.1 as a
     trustworthy origin and exempts it; WebKit does not, and upgrades every
     script and font to https://127.0.0.1, where there is no TLS listener. The
     result is a page whose assets all fail, React never hydrates, and every
     route sits on its splash forever. Nothing is weakened on Vercel by this —
     `E2E` is set by `npm run e2e:build` and by nothing else. */
  ...(process.env.E2E === "true" ? [] : ["upgrade-insecure-requests"]),
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
  // The browser tests build with the demo dataset compiled in, which is a
  // different build from the one you deploy. Letting them write somewhere else
  // means running them never clobbers the `.next` you already have.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
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
