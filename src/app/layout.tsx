import type { Metadata, Viewport } from "next";
import { Archivo, Hanken_Grotesk, Geist_Mono, Space_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Providers } from "./providers";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

// Used by the marketing homepage for mono accents (eyebrows, chips, stats).
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Frontrow — your teams, one screen",
  description:
    "A personal companion for NFL, college football, NHL and MLB. Live scores, standings and season stats for only the teams and players you follow.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f1ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1622" },
  ],
  width: "device-width",
  initialScale: 1,
  // Lets the layout reach under the notch and home indicator, which is what
  // makes env(safe-area-inset-*) resolve to real values in the iOS shell.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // The first-paint script below may change data-appearance before React
      // hydrates; that's intended, so don't warn about the attribute mismatch.
      suppressHydrationWarning
      data-appearance="light"
      className={`${archivo.variable} ${hanken.variable} ${geistMono.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <head>
        {/* Paint the right theme before React loads: the remembered choice if
            there is one, otherwise the device's scheme (the "system" default).
            ThemeController takes over from here once hydrated. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var p=localStorage.getItem('fr-appearance');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.appearance=(p==='light'||p==='dark')?p:(d?'dark':'light')}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
