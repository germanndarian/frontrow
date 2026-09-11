import type { Viewport } from "next";

/* The iOS app route locks the viewport scale so it behaves like a native
   app: no auto-zoom when a field is focused, no pinch-zoom. The website keeps
   the root layout's zoomable viewport — this override applies to /app only. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f1ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1622" },
  ],
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
