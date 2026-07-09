import React, { useEffect, useRef } from "react";
import { maxxPackages, maxxPricingNote, maxxValueEquation, maxxBrand } from "@/content/maxxOffer";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Pricing + value stack. The Hormozi grand-slam offer made explicit:
 * ownership (like a phone), risk reversal, and three packages framed as
 * escalating operations rather than feature tiers.
 */
export const PricingSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardsRef.current?.querySelectorAll<HTMLElement>("[data-package]");
      if (!cards?.length) return;

      gsap.fromTo(
        cards,
        { y: 44, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 72%",
            end: "bottom bottom",
            scrub: 0.75,
            invalidateOnRefresh: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="relative overflow-hidden bg-[#050608] px-6 py-20 text-white md:px-10 lg:px-12 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,122,60,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(70,213,255,0.10),transparent_26%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.46em] text-maxx-orange/78">Choose Your Operation</p>
          <h2 className="mt-4 text-4xl font-black uppercase leading-[0.92] text-white md:text-6xl">
            Own it. Finance it. Or have us run it.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/68 md:text-lg">
            {maxxPricingNote}
          </p>
        </div>

        {/* Value equation strip */}
        <div className="mt-10 grid gap-4 rounded-[28px] border border-white/10 bg-white/[0.035] p-6 md:grid-cols-4 md:p-8">
          {[
            { label: "Dream outcome", value: maxxValueEquation.dream },
            { label: "Likelihood", value: maxxValueEquation.likelihood },
            { label: "Time delay", value: maxxValueEquation.timeDelay },
            { label: "Effort", value: maxxValueEquation.effort },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[10px] uppercase tracking-[0.4em] text-maxx-cyan/70">{item.label}</p>
              <p className="mt-3 text-sm leading-7 text-white/80">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Packages */}
        <div ref={cardsRef} className="mt-10 grid gap-5 lg:grid-cols-3">
          {maxxPackages.map((pkg) => (
            <article
              key={pkg.id}
              data-package
              className={`relative flex flex-col rounded-[30px] border p-6 backdrop-blur-sm transition-colors md:p-8 ${
                pkg.popular
                  ? "border-maxx-orange/60 bg-[linear-gradient(180deg,rgba(255,122,60,0.10),rgba(255,255,255,0.02))] shadow-2xl shadow-black/50"
                  : "border-white/10 bg-white/[0.035] shadow-2xl shadow-black/30"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-maxx-orange px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-black">
                  First Client Pick
                </span>
              )}
              <p className="text-[10px] uppercase tracking-[0.42em] text-maxx-cyan/70">{pkg.codename}</p>
              <h3 className="mt-3 text-2xl font-black uppercase leading-none text-white">{pkg.name}</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">{pkg.tagline}</p>

              <div className="mt-6 space-y-2 border-y border-white/10 py-5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-[0.36em] text-white/40">Setup</span>
                  <span className="text-2xl font-black text-white">{pkg.setup}</span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-[0.36em] text-white/40">Own it</span>
                  <span className="text-base font-bold text-white">{pkg.ownership}</span>
                </div>
                {pkg.management && (
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[10px] uppercase tracking-[0.36em] text-white/40">We manage</span>
                    <span className="text-sm font-semibold text-white/80">{pkg.management}</span>
                  </div>
                )}
              </div>

              <p className="mt-5 text-[11px] uppercase tracking-[0.3em] text-white/45">Includes</p>
              <ul className="mt-3 flex-1 space-y-2">
                {pkg.includes.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-white/76">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-maxx-orange" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 border-l-2 border-maxx-cyan/50 pl-3 text-xs italic leading-6 text-white/55">
                {pkg.bestFor}
              </p>

              <a
                href="#audit"
                className={`mt-6 inline-flex items-center justify-center px-5 py-3 text-xs font-bold uppercase tracking-[0.34em] transition-colors ${
                  pkg.popular
                    ? "bg-maxx-orange text-black hover:bg-white"
                    : "border border-white/20 text-white hover:border-maxx-orange hover:text-maxx-orange"
                }`}
              >
                Book the Audit
              </a>
            </article>
          ))}
        </div>

        {/* Risk reversal */}
        <div className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <p className="text-[10px] uppercase tracking-[0.46em] text-maxx-orange/78">Risk reversal</p>
          <p className="mt-4 max-w-4xl text-base leading-8 text-white/82">{maxxBrand.riskReversal}</p>
        </div>
      </div>
    </section>
  );
};
