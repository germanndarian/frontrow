"use client";

import Image from "next/image";

/* The iOS app's front door. Deliberately dark and branded regardless of the
   chosen theme — it's the floodlit night game, the same call home.css makes
   for the marketing homepage — so its palette is intentionally inline. */

const FEATURES = [
  ["01", "Live scores and play-by-play", "Period, clock, count and the last thing that happened."],
  ["02", "Season stats and standings", "Form, per-game splits, divisions and playoff brackets."],
  ["03", "Players you tune in for", "Game logs and league ranks for every name you star."],
] as const;

export function Welcome({ onSignup, onSignin, onGuest }: { onSignup: () => void; onSignin: () => void; onGuest: () => void }) {
  return (
    <div
      className="flex min-h-dvh flex-col bg-[#0f1622] text-white"
      style={{
        backgroundImage:
          "radial-gradient(46rem 30rem at 12% -6%, oklch(.68 .16 257/.4), transparent 62%), radial-gradient(40rem 28rem at 104% 8%, oklch(.66 .14 280/.28), transparent 60%)",
      }}
    >
      <div className="flex items-center gap-[9px] px-6" style={{ paddingTop: "max(56px, calc(env(safe-area-inset-top) + 20px))" }}>
        <Image src="/stadium-logo.png" alt="" width={28} height={28} className="h-7 w-7 rounded-[8px] object-cover" />
        <span className="font-display text-[17px] font-black leading-none tracking-[-0.02em]">
          FRONT<span className="text-[#7fa9f0]">ROW</span>
        </span>
      </div>

      <div className="px-6 pt-11">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 py-[5px] pl-1.5 pr-[11px] text-[11px] font-semibold text-white/80">
          <span className="rounded-full bg-primary px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">NEW</span>
          NFL · NBA · MLB · NHL · NCAAF
        </span>
        <h1 className="mt-[22px] font-display text-[44px] font-black leading-[0.98] tracking-[-0.035em]">
          Your teams.
          <br />
          Every game.
          <br />
          <em className="italic text-[#7fa9f0]">Front row seat.</em>
        </h1>
        <p className="mt-[18px] max-w-[30ch] text-[15px] leading-[1.55] text-white/60">
          Live scores, season stats and standings for only the teams you follow. Nothing else.
        </p>
      </div>

      <div className="mx-6 mt-8 rounded-[20px] border border-white/10 bg-white/5 px-4 py-1">
        {FEATURES.map(([n, title, body], i) => (
          <div key={n} className={i > 0 ? "flex items-start gap-3 border-t border-white/8 py-[13px]" : "flex items-start gap-3 py-[13px]"}>
            <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-[8px] bg-white/10 font-mono text-[9px] font-bold text-[#7fa9f0]">{n}</span>
            <span className="min-w-0">
              <span className="block font-display text-[13.5px] font-bold">{title}</span>
              <span className="mt-0.5 block text-[12px] leading-[1.45] text-white/50">{body}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="mx-6 mt-5 flex items-center gap-2.5">
        <span className="h-px flex-1 bg-white/12" />
        <span className="text-[10px] font-semibold tracking-[0.16em] text-white/55">COVERING</span>
        <span className="h-px flex-1 bg-white/12" />
      </div>
      <div className="mx-6 mt-3.5 flex flex-wrap gap-[7px]">
        {["MLB", "NHL", "NFL", "NBA", "NCAAF"].map((l) => (
          <span key={l} className="rounded-full border border-white/10 bg-white/7 px-3 py-1.5 text-[11.5px] font-semibold text-white/70">
            {l}
          </span>
        ))}
      </div>
      <p className="mx-6 mt-[22px] text-[12px] leading-[1.5] text-white/55">
        Scores and stats via ESPN&apos;s public endpoints. Free, no ads, no account required to look around.
      </p>

      <div
        className="sticky bottom-0 mt-auto flex flex-col gap-2.5 px-6 pt-[22px] backdrop-blur-[10px]"
        style={{
          paddingBottom: "max(30px, calc(env(safe-area-inset-bottom) + 14px))",
          background: "linear-gradient(to bottom, rgba(15,22,34,0) 0%, rgba(15,22,34,.86) 26%, #0f1622 60%)",
        }}
      >
        <button type="button" onClick={onSignup} className="w-full rounded-full bg-primary py-[15px] text-[15px] font-bold text-primary-ink active:scale-[0.98]">
          Get started free
        </button>
        <button type="button" onClick={onSignin} className="w-full rounded-full border border-white/22 bg-white/6 py-[15px] text-[15px] font-semibold text-white active:scale-[0.98]">
          I already have an account
        </button>
        <button type="button" onClick={onGuest} className="w-full py-1.5 text-[13px] font-semibold text-white/50">
          Look around as a guest
        </button>
      </div>
    </div>
  );
}
