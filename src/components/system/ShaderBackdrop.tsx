"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

/* ───────────────────────────────────────────────────────────────────────────
   Ambient Paper-Shaders backdrop. A slow cobalt mesh-gradient fixed behind the
   page so empty areas read as an atmospheric wash rather than flat space — the
   same energy as the marketing homepage. Sits below content (-z-10), ignores
   pointer events, fades out toward the bottom so cards stay legible, and honours
   the theme + reduce-motion settings (motion frozen when reduced).
   ─────────────────────────────────────────────────────────────────────────── */

const PALETTES: Record<"light" | "dark", string[]> = {
  // Soft cobalt clouds over cream.
  light: ["#f1f1ec", "#e3ecfc", "#aac6f6", "#3c82e6", "#eef2fb"],
  // Cobalt aurora over midnight.
  dark: ["#0b1124", "#13224a", "#2b5fd0", "#0a0f1f", "#16203f"],
};

export function ShaderBackdrop({ className }: { className?: string }) {
  const appearance = useSettings((s) => s.appearance);
  const reduceMotion = useSettings((s) => s.reduceMotion);
  const isLight = appearance !== "dark";
  const mask = "radial-gradient(125% 105% at 50% 0%, #000 28%, transparent 86%)";

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}
      style={{
        opacity: isLight ? 0.6 : 0.55,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    >
      <MeshGradient
        width="100%"
        height="100%"
        style={{ width: "100%", height: "100%" }}
        colors={isLight ? PALETTES.light : PALETTES.dark}
        distortion={0.85}
        swirl={0.6}
        grainOverlay={0.06}
        speed={reduceMotion ? 0 : 0.28}
      />
    </div>
  );
}
