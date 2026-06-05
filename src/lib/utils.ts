import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** ESPN packs team colors as bare hex ("132448"). Normalize to a CSS color. */
export function hex(color?: string | null, fallback = "64748b"): string {
  const c = (color ?? "").replace("#", "").trim();
  return `#${/^[0-9a-fA-F]{6}$/.test(c) ? c : fallback}`;
}

/** Relative time for kickoffs and finals: "in 2h", "3h ago", "Sat 1:00 PM". */
export function relativeTime(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime();
  const diffMin = Math.round((t - now) / 60_000);
  const abs = Math.abs(diffMin);
  if (abs < 1) return "now";
  if (abs < 60) return diffMin > 0 ? `in ${abs}m` : `${abs}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 24)
    return diffH > 0 ? `in ${diffH}h` : `${Math.abs(diffH)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** "8:05 PM" in the viewer's locale. */
export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Initials from a team name, used as the logo fallback monogram. */
export function monogram(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
