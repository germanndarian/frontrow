import type { CapacitorConfig } from "@capacitor/cli";

/* Native iOS shell around the deployed site.

   `server.url` points the WKWebView at production rather than bundling the
   site: the dashboard depends on the /api/* route handlers and on cookie auth
   through @supabase/ssr, both of which would become cross-origin (and so need
   CORS plus cross-site cookies) if the frontend were bundled locally. Loading
   the real origin keeps auth, cookies and data identical to the website, and
   means content ships from Vercel without re-signing the app.

   `webDir` is still required by the CLI; it holds the offline fallback shown
   when the phone can't reach the deployment. */
const config: CapacitorConfig = {
  appId: "com.germanndarian.frontrow",
  appName: "Frontrow",
  webDir: "capacitor/www",
  server: {
    url: "https://frontrow-ten.vercel.app/app",
    cleartext: false,
  },
  ios: {
    // Let the web app handle the notch/home-indicator itself via safe-area
    // insets (globals.css) instead of WebKit inserting its own padding.
    contentInset: "never",
  },
};

export default config;
