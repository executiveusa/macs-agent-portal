import React, { useEffect, useRef } from "react";
import { maxxQuickWins, maxxOutcomes } from "@/content/maxxOffer";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Two-part section: the three outcomes MAXX delivers (what changes), then
 * the six concrete quick-win workflows (how it shows up day to day).
 */
export const QuickWinsSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const outcomesRef = useRef<HTMLDivElement>(null);
  const winsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const outcomes = outcomesRef.current?.querySelectorAll<HTMLElement>("[data-outcome]");
      const wins = winsRef.current?.querySelectorAll<HTMLElement>("[data-win]");

      if (outcomes?.length) {
        gsap.fromTo(
          outcomes,
          { y: 38, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: outcomesRef.current,
              start: "top 78%",
              end: "bottom bottom",
              scrub: 0.75,
              invalidateOnRefresh: true,
            },
          }
        );
      }

      if (wins?.length) {
        gsap.fromTo(
          wins,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: {
              trigger: winsRef.current,
              start: "top 82%",
              end: "bottom bottom",
              scrub: 0.7,
              invalidateOnRefresh: true,
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="outcomes"
      className="relative overflow-hidden bg-[linear-gradient(180deg,#080a0d_0%,#050608_100%)] px-6 py-20 text-white md:px-10 lg:px-12 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(70,213,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,122,60,0.10),transparent_28%)]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Outcomes */}
        <div className="max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.46em] text-maxx-cyan/78">The Outcome</p>
          <h2 className="mt-4 text-4xl font-black uppercase leading-[0.92] text-white md:text-6xl">
            Recover conversations. Own your data. Approve every move.
          </h2>
        </div>

        <div ref={outcomesRef} className="mt-12 grid gap-5 md:grid-cols-3">
          {maxxOutcomes.map((outcome) => (
            <article
              key={outcome.id}
              data-outcome
              className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30"
            >
              <p className="text-[10px] uppercase tracking-[0.42em] text-maxx-orange/78">{outcome.eyebrow}</p>
              <h3 className="mt-3 text-xl font-black uppercase leading-tight text-white">{outcome.title}</h3>
              <p className="mt-4 text-sm leading-7 text-white/72">{outcome.detail}</p>
              <p className="mt-4 border-l-2 border-maxx-cyan/50 pl-4 text-sm leading-7 text-white/86">
                {outcome.outcome}
              </p>
            </article>
          ))}
        </div>

        {/* Quick wins */}
        <div className="mt-20">
          <div className="max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.46em] text-maxx-orange/78">Quick-Win Workflows</p>
            <h3 className="mt-4 text-3xl font-black uppercase leading-tight text-white md:text-4xl">
              The missions MAXX runs out of the box.
            </h3>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/68">
              Each one drafts the action and waits for human approval. Pick one to start — often producing real
              conversations before the full system is installed.
            </p>
          </div>

          <div ref={winsRef} className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {maxxQuickWins.map((win) => (
              <div
                key={win.id}
                data-win
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition-colors hover:border-maxx-cyan/40"
              >
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-maxx-cyan/40 text-[10px] font-black text-maxx-cyan">
                  ◆
                </span>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wide text-white">{win.title}</h4>
                  <p className="mt-1 text-sm leading-6 text-white/68">{win.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
