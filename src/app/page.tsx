"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import "./home.css";

/** A small arrow used on the accent CTAs. */
function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Checkmark tick used in the feature bullet lists. */
function Tick() {
  return (
    <span className="tick">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </span>
  );
}

const Brand = () => (
  <a className="brand" href="#top">
    <span className="brand__mark" />
    <span className="brand__word">
      FRONT<span>ROW</span>
    </span>
  </a>
);

export default function Home() {
  const rootRef = useRef<HTMLDivElement>(null);

  // Scroll-animation engine, ported from the design prototype. Base state is
  // fully visible (no-JS / reduced-motion safe); JS adds `anim` to the root and
  // drives `.in` bidirectionally as elements enter/leave the viewport, plus a
  // sticky-nav border, hero parallax, and a count-up on the stat band.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const nav = root.querySelector<HTMLElement>(".nav");
    const onNav = () => nav?.classList.toggle("scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onNav, { passive: true });
    onNav();

    const cleanups: Array<() => void> = [
      () => window.removeEventListener("scroll", onNav),
    ];

    if (!reduce) {
      root.classList.add("anim");

      const targets = [
        ...root.querySelectorAll<HTMLElement>(
          ".reveal, .reveal-l, .reveal-r, .reveal-scale, .reveal-blur",
        ),
      ];

      // stagger siblings within a section
      targets.forEach((el) => {
        const sec = el.closest("section, header, footer");
        const sibs = sec
          ? [...sec.querySelectorAll(".reveal, .reveal-l, .reveal-r, .reveal-scale, .reveal-blur")]
          : [el];
        el.style.transitionDelay = Math.min(sibs.indexOf(el) * 0.08, 0.32) + "s";
      });

      const setIn = (el: Element, on: boolean) => el.classList.toggle("in", on);

      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => setIn(e.target, e.isIntersecting)),
        { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
      );
      targets.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());

      // reliable first paint for whatever is already on screen
      const vh = () => window.innerHeight || 800;
      requestAnimationFrame(() => {
        targets.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.top < vh() * 0.92 && r.bottom > 0) setIn(el, true);
        });
      });

      // hero parallax
      const floats = [...root.querySelectorAll<HTMLElement>(".stagewrap .float")];
      const speeds = [0.06, -0.04, 0.1];
      let ticking = false;
      const parallax = () => {
        const y = window.scrollY;
        floats.forEach((el, i) => {
          el.style.translate = "0 " + (y * (speeds[i] || 0.05)).toFixed(1) + "px";
        });
        ticking = false;
      };
      const onScroll = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(parallax);
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanups.push(() => window.removeEventListener("scroll", onScroll));

      // count-up for the stat band
      const band = root.querySelector<HTMLElement>(".statband");
      if (band) {
        const nums = [...band.querySelectorAll<HTMLElement>(".num")].map((el) => {
          const node = el.firstChild;
          const text = node && node.nodeType === 3 ? node.textContent?.trim() ?? "" : "";
          const target = parseInt(text, 10);
          return { node, target, ok: !isNaN(target) };
        });
        let counted = false;
        const run = () => {
          if (counted) return;
          counted = true;
          nums.forEach(({ node, target, ok }) => {
            if (!ok || !node) return;
            const dur = 1100;
            const t0 = performance.now();
            const tick = (now: number) => {
              const p = Math.min((now - t0) / dur, 1);
              const eased = 1 - Math.pow(1 - p, 3);
              node.textContent = String(Math.round(target * eased));
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          });
        };
        const cio = new IntersectionObserver(
          (entries) => entries.forEach((e) => e.isIntersecting && run()),
          { threshold: 0.4 },
        );
        cio.observe(band);
        cleanups.push(() => cio.disconnect());
        const timer = window.setTimeout(() => {
          if (band.getBoundingClientRect().top < vh()) run();
        }, 1400);
        cleanups.push(() => window.clearTimeout(timer));
      }
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div className="fr-home" ref={rootRef}>
      {/* ============ NAV ============ */}
      <header className="nav">
        <Brand />
        <nav className="nav__links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#leagues">Leagues</a>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
        <div className="nav__right">
          <Link className="nav__login" href="/login">
            Log in
          </Link>
          <Link className="btn btn-accent" href="/login?mode=signup">
            Sign up
            <Arrow />
          </Link>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="hero" id="top">
        <div className="hero__bg" />
        <div className="hero__grid" />
        <div className="section">
          <div className="hero__copy">
            <div className="hero__badge reveal">
              <span className="pill">NEW</span>
              <span>
                <b>Multi-league</b> tracking — NFL, NHL &amp; MLB in one place
              </span>
            </div>
            <h1 className="reveal">
              Your teams.
              <br />
              Every game.
              <br />
              <em>Front row seat.</em>
            </h1>
            <p className="hero__sub reveal">
              Live box scores, deep team analytics, and conference standings across every
              league you follow — in one beautifully simple dashboard that recolors to
              whichever team you&apos;re watching.
            </p>
            <div className="hero__cta reveal">
              <Link className="btn btn-accent btn-lg" href="/login?mode=signup">
                Get started free
                <Arrow />
              </Link>
              <a className="btn btn-ghost btn-lg" href="#features">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M10 8l6 4-6 4z" fill="currentColor" stroke="none" />
                </svg>
                See how it works
              </a>
            </div>
            <div className="hero__meta reveal">
              <span>
                <span className="live-dot" style={{ display: "inline-block", marginRight: 6, verticalAlign: "middle" }} />
                3 games live now
              </span>
              <span className="dotsep" />
              <span>Real-time scores</span>
              <span className="dotsep" />
              <span>Free to start</span>
            </div>
          </div>

          {/* composed product visual */}
          <div className="stagewrap reveal-scale">
            <div className="stage">
              {/* live game card */}
              <article className="card float hcard-live">
                <div className="lc-top">
                  <span className="chip">MLB</span>
                  <span className="livetag">
                    <span className="live-dot" />
                    LIVE
                  </span>
                </div>
                <div className="row">
                  <span className="mark" style={{ width: 28, height: 28, fontSize: 9.5, background: "#002D72" }}>
                    NYM
                  </span>
                  <span className="nm">Mets</span>
                  <span className="pts">3</span>
                </div>
                <div className="row win">
                  <span className="mark" style={{ width: 28, height: 28, fontSize: 9.5, background: "#13274F" }}>
                    ATL
                  </span>
                  <span className="nm">Braves</span>
                  <span className="pts">4</span>
                </div>
                <div className="lc-foot">
                  <span className="lc-period">BOT 7th · 2 out</span>
                  <span className="lc-note">Runner on 2nd</span>
                </div>
              </article>

              {/* team card */}
              <article className="card float hcard-team" style={{ "--c": "#5A1414", "--c2": "#FFB612" } as React.CSSProperties}>
                <div className="tc-band" style={{ background: "linear-gradient(90deg,var(--c),var(--c2))" }} />
                <div className="tc-head">
                  <span className="mark" style={{ width: 40, height: 40, fontSize: 13, background: "var(--c)" }}>
                    WAS
                  </span>
                  <span>
                    <span className="tc-city">Washington</span>
                    <br />
                    <span className="tc-name">Commanders</span>
                  </span>
                </div>
                <div className="tc-stats">
                  <span className="tc-st">
                    <span className="v">11–6</span>
                    <br />
                    <span className="l">W–L</span>
                  </span>
                  <span className="tc-st">
                    <span className="v">1st</span>
                    <br />
                    <span className="l">NFC East</span>
                  </span>
                  <span className="tc-st">
                    <span className="v" style={{ color: "var(--c)" }}>
                      W2
                    </span>
                    <br />
                    <span className="l">Streak</span>
                  </span>
                </div>
              </article>

              {/* mini chart card */}
              <article className="card float hcard-chart">
                <div className="ch-head">
                  <h5>Season form</h5>
                  <span className="tag">games over .500</span>
                </div>
                <svg className="ch-svg" viewBox="0 0 240 96" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF4D2E" stopOpacity="0.26" />
                      <stop offset="100%" stopColor="#FF4D2E" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M6 78 L6 70 L24 64 L42 66 L60 54 L78 44 L96 50 L114 40 L132 30 L150 36 L168 26 L186 18 L204 24 L222 14 L234 12 L234 78 Z" fill="url(#hg)" />
                  <path d="M6 70 L24 64 L42 66 L60 54 L78 44 L96 50 L114 40 L132 30 L150 36 L168 26 L186 18 L204 24 L222 14 L234 12" fill="none" stroke="#FF4D2E" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                  <circle cx="234" cy="12" r="4" fill="#FF4D2E" stroke="#fff" strokeWidth="2" />
                </svg>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ============ LEAGUES STRIP ============ */}
      <section className="leagues" id="leagues">
        <div className="leagues__inner">
          <span className="leagues__label">All your leagues, one feed</span>
          <div className="leagues__list">
            {["NFL", "NHL", "MLB", "NBA", "MLS", "NCAA", "EPL"].map((l) => (
              <span className="league-name" key={l}>
                {l}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STAT BAND ============ */}
      <section className="statband section">
        <div className="statband__grid">
          <div className="statcell reveal">
            <div className="num">
              12<span>+</span>
            </div>
            <div className="cap">Leagues tracked</div>
          </div>
          <div className="statcell reveal">
            <div className="num">
              &lt;1<span>s</span>
            </div>
            <div className="cap">Score updates</div>
          </div>
          <div className="statcell reveal">
            <div className="num">
              40<span>k</span>
            </div>
            <div className="cap">Games a season</div>
          </div>
          <div className="statcell reveal">
            <div className="num">
              100<span>%</span>
            </div>
            <div className="cap">Your teams, no noise</div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="features section" id="features">
        <div className="feat-intro reveal">
          <span className="eyebrow">Built for real fans</span>
          <h2 className="h-sec">
            Everything that matters,
            <br />
            nothing that doesn&apos;t.
          </h2>
          <p className="lede">
            FrontRow pulls the leagues you care about into a single, fast dashboard — then
            gets out of your way so you can just watch the game.
          </p>
        </div>

        {/* feature 1: live */}
        <article className="feat">
          <div className="feat__text reveal-l">
            <span className="feat__num">01 — LIVE SCORES</span>
            <h3>Feel every play, pitch and shift.</h3>
            <p>
              Full live box scores — not just the line. Count, baserunners, power plays,
              shots on goal, possession. The moment something happens, it&apos;s on your screen.
            </p>
            <div className="feat__list">
              <div className="feat__li">
                <Tick />
                Real-time box scores across every live game
              </div>
              <div className="feat__li">
                <Tick />
                Filter the feed by league in one tap
              </div>
              <div className="feat__li">
                <Tick />
                Upcoming games with start times &amp; odds
              </div>
            </div>
          </div>
          <div className="feat__visual reveal-r">
            <div className="feat-live-stack">
              <article className="card">
                <div className="lc-top">
                  <span className="chip">NHL</span>
                  <span className="livetag">
                    <span className="live-dot" />
                    LIVE
                  </span>
                </div>
                <div className="row win">
                  <span className="mark" style={{ width: 28, height: 28, fontSize: 9.5, background: "#CF0A2C" }}>
                    CHI
                  </span>
                  <span className="nm">Blackhawks</span>
                  <span className="pts">2</span>
                </div>
                <div className="row">
                  <span className="mark" style={{ width: 28, height: 28, fontSize: 9.5, background: "#6F263D" }}>
                    COL
                  </span>
                  <span className="nm">Avalanche</span>
                  <span className="pts">2</span>
                </div>
                <div className="lc-foot">
                  <span className="lc-period">P2 · 08:42</span>
                  <span className="lc-note">Power play · 1:24</span>
                </div>
              </article>
              <article className="card">
                <div className="lc-top">
                  <span className="chip">MLB</span>
                  <span className="livetag">
                    <span className="live-dot" />
                    LIVE
                  </span>
                </div>
                <div className="row win">
                  <span className="mark" style={{ width: 28, height: 28, fontSize: 9.5, background: "#0C2340" }}>
                    NYY
                  </span>
                  <span className="nm">Yankees</span>
                  <span className="pts">5</span>
                </div>
                <div className="row">
                  <span className="mark" style={{ width: 28, height: 28, fontSize: 9.5, background: "#BD3039" }}>
                    BOS
                  </span>
                  <span className="nm">Red Sox</span>
                  <span className="pts">2</span>
                </div>
                <div className="lc-foot">
                  <span className="lc-period">TOP 5th</span>
                  <span className="lc-note">Cole — 7 K</span>
                </div>
              </article>
            </div>
          </div>
        </article>

        {/* feature 2: stats */}
        <article className="feat">
          <div className="feat__text reveal-l">
            <span className="feat__num">02 — TEAM ANALYTICS</span>
            <h3>The story behind the record.</h3>
            <p>
              Click any team and the entire stats section re-renders — and recolors — around
              them. Season form, league-ranking trend, scored vs. allowed, and last-ten
              streaks, all in clean, readable charts.
            </p>
            <div className="feat__list">
              <div className="feat__li">
                <Tick />
                Dynamic — one click switches the whole view
              </div>
              <div className="feat__li">
                <Tick />
                Form, ranking, scoring &amp; streak charts
              </div>
              <div className="feat__li">
                <Tick />
                Themed in each team&apos;s real colors
              </div>
            </div>
          </div>
          <div className="feat__visual reveal-r">
            <article className="card" style={{ width: "100%", maxWidth: 340, boxShadow: "var(--shadow)" }}>
              <div className="ch-head">
                <h5>League ranking</h5>
                <span className="tag">peak 1st</span>
              </div>
              <svg className="ch-svg" viewBox="0 0 320 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="fg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5A1414" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#5A1414" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M8 110 L8 96 L36 82 L64 70 L92 78 L120 60 L148 50 L176 42 L204 32 L232 24 L260 18 L288 14 L312 8 L312 110 Z" fill="url(#fg2)" />
                <path d="M8 96 L36 82 L64 70 L92 78 L120 60 L148 50 L176 42 L204 32 L232 24 L260 18 L288 14 L312 8" fill="none" stroke="#5A1414" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
                <circle cx="312" cy="8" r="4.5" fill="#5A1414" stroke="#fff" strokeWidth="2" />
                <text x="296" y="26" textAnchor="end" fontFamily="Archivo" fontSize="15" fontWeight="900" fill="#5A1414">
                  #1
                </text>
              </svg>
              <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                {(["W", "L", "W", "W", "W"] as const).map((r, i) => (
                  <span
                    key={i}
                    style={{
                      flex: 1,
                      height: 34,
                      borderRadius: 7,
                      background: r === "W" ? "#5A1414" : "#d8d8d2",
                      color: r === "W" ? "#fff" : "#75756e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--ff-mono)",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </article>
          </div>
        </article>

        {/* feature 3: standings */}
        <article className="feat">
          <div className="feat__text reveal-l">
            <span className="feat__num">03 — STANDINGS</span>
            <h3>Know exactly where they stand.</h3>
            <p>
              Live conference and division tables for every team you follow, with your club
              highlighted so you can find it in a glance. Wins, losses, points, streaks —
              sorted and always current.
            </p>
            <div className="feat__list">
              <div className="feat__li">
                <Tick />
                Division &amp; conference tables side by side
              </div>
              <div className="feat__li">
                <Tick />
                Your team highlighted in its colors
              </div>
            </div>
          </div>
          <div className="feat__visual reveal-r">
            <div className="mini-standings">
              <div className="sh">
                <span className="chip">NFL</span>
                <h6>NFC East</h6>
              </div>
              <table>
                <thead>
                  <tr>
                    <th className="l">Team</th>
                    <th>W</th>
                    <th>L</th>
                    <th>PCT</th>
                    <th>STRK</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="mine" style={{ "--c": "#5A1414" } as React.CSSProperties}>
                    <td className="tm">
                      <span className="mark" style={{ width: 22, height: 22, fontSize: 8, background: "#5A1414" }}>
                        WAS
                      </span>
                      <span className="nm">Commanders</span>
                    </td>
                    <td>11</td>
                    <td>6</td>
                    <td>.647</td>
                    <td>W2</td>
                  </tr>
                  <tr>
                    <td className="tm">
                      <span className="mark" style={{ width: 22, height: 22, fontSize: 8, background: "#004C54" }}>
                        PHI
                      </span>
                      <span className="nm">Eagles</span>
                    </td>
                    <td>10</td>
                    <td>7</td>
                    <td>.588</td>
                    <td>L1</td>
                  </tr>
                  <tr>
                    <td className="tm">
                      <span className="mark" style={{ width: 22, height: 22, fontSize: 8, background: "#041E42" }}>
                        DAL
                      </span>
                      <span className="nm">Cowboys</span>
                    </td>
                    <td>9</td>
                    <td>8</td>
                    <td>.529</td>
                    <td>W1</td>
                  </tr>
                  <tr>
                    <td className="tm">
                      <span className="mark" style={{ width: 22, height: 22, fontSize: 8, background: "#0B2265" }}>
                        NYG
                      </span>
                      <span className="nm">Giants</span>
                    </td>
                    <td>5</td>
                    <td>12</td>
                    <td>.294</td>
                    <td>L3</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </article>

        {/* feature 4: favorites */}
        <article className="feat">
          <div className="feat__text reveal-l">
            <span className="feat__num">04 — FAVORITES</span>
            <h3>Just your teams. No noise.</h3>
            <p>
              Follow clubs across any sport and FrontRow builds your dashboard around them —
              favorite cards up top, their games surfaced first, their standings pinned. The
              rest of the sports world stays out of your way.
            </p>
            <div className="feat__list">
              <div className="feat__li">
                <Tick />
                Mix teams from any league you like
              </div>
              <div className="feat__li">
                <Tick />
                Their games &amp; news bubble to the top
              </div>
            </div>
          </div>
          <div className="feat__visual reveal-r">
            <div className="fav-cloud">
              <span className="fav-chip on" style={{ "--c": "#13274F" } as React.CSSProperties}>
                <span className="mark" style={{ width: 26, height: 26, fontSize: 9, background: "#13274F" }}>
                  ATL
                </span>
                Braves<span className="x">✕</span>
              </span>
              <span className="fav-chip on" style={{ "--c": "#5A1414" } as React.CSSProperties}>
                <span className="mark" style={{ width: 26, height: 26, fontSize: 9, background: "#5A1414" }}>
                  WAS
                </span>
                Commanders<span className="x">✕</span>
              </span>
              <span className="fav-chip on" style={{ "--c": "#CF0A2C" } as React.CSSProperties}>
                <span className="mark" style={{ width: 26, height: 26, fontSize: 9, background: "#CF0A2C" }}>
                  CHI
                </span>
                Blackhawks<span className="x">✕</span>
              </span>
              <span className="fav-chip" style={{ opacity: 0.55 }}>
                <span className="mark" style={{ width: 26, height: 26, fontSize: 9, background: "#552583" }}>
                  LAL
                </span>
                Lakers<span className="x">＋</span>
              </span>
            </div>
          </div>
        </article>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="how section" id="how">
        <div className="how__head reveal">
          <span className="eyebrow">Up and running in a minute</span>
          <h2 className="h-sec">
            Three steps to your
            <br />
            front row seat.
          </h2>
        </div>
        <div className="steps">
          <article className="step reveal">
            <div className="step__n">1</div>
            <span className="step__line" />
            <h4>Pick your teams</h4>
            <p>
              Search any club across the NFL, NHL, MLB and more, then tap to follow. Build a
              roster that spans every sport you love.
            </p>
          </article>
          <article className="step reveal">
            <div className="step__n">2</div>
            <span className="step__line" />
            <h4>Watch it live</h4>
            <p>
              Your dashboard fills with live box scores and upcoming games — updated the
              instant anything changes on the field or ice.
            </p>
          </article>
          <article className="step reveal">
            <div className="step__n">3</div>
            <h4>Dive into the numbers</h4>
            <p>
              Click any team to unfold full analytics — form, rankings, scoring and streaks —
              themed in their colors. Standings always at the bottom.
            </p>
          </article>
        </div>
      </section>

      {/* ============ QUOTE ============ */}
      <section className="quote section">
        <div className="quote__card reveal-scale">
          <div className="quote__mark">“</div>
          <blockquote>
            I follow three teams across three leagues and I used to bounce between four apps.
            Now it&apos;s <span>one tab</span> — scores, stats, and standings, all in my
            teams&apos; colors.
          </blockquote>
          <div className="quote__by">
            <span className="av">JM</span>
            <span className="who">
              <b>Jordan Mills</b>
              <small>SEASON-TICKET HOLDER · ATL · WAS · CHI</small>
            </span>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="cta section">
        <div className="cta__card reveal-scale">
          <span className="glow" />
          <span className="eyebrow" style={{ justifyContent: "center", marginBottom: 18 }}>
            Game on
          </span>
          <h2>
            Get your front
            <br />
            row seat.
          </h2>
          <p>Build your dashboard in under a minute. Free to start, every league included.</p>
          <div className="cta__row">
            <Link className="btn btn-accent btn-lg" href="/login?mode=signup">
              Get started free
              <Arrow />
            </Link>
            <a className="btn btn-ghost btn-lg" href="#features">
              Explore features
            </a>
          </div>
          <p className="cta__fine">No credit card · Cancel anytime · 12+ leagues</p>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <Brand />
            <p>
              The fastest way to follow every team you love, across every league, in one
              place.
            </p>
          </div>
          <div className="footer__col">
            <h6>Product</h6>
            <Link href="/dashboard">Dashboard</Link>
            <a href="#features">Live scores</a>
            <a href="#features">Team stats</a>
            <a href="#features">Standings</a>
          </div>
          <div className="footer__col">
            <h6>Leagues</h6>
            <a href="#leagues">NFL</a>
            <a href="#leagues">NHL</a>
            <a href="#leagues">MLB</a>
            <a href="#leagues">More</a>
          </div>
          <div className="footer__col">
            <h6>Company</h6>
            <a href="#top">About</a>
            <a href="#top">Careers</a>
            <a href="#top">Press</a>
            <a href="#top">Contact</a>
          </div>
        </div>
        <div className="footer__bar">
          <span>© 2026 FrontRow Labs · Mock product for design review</span>
          <span>Privacy · Terms · Cookies</span>
        </div>
      </footer>
    </div>
  );
}
