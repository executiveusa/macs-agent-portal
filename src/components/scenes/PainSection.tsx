import React, { useEffect, useRef } from "react";
import { maxxPains } from "@/content/maxxOffer";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * The pain stack — three cards that name what hurts a tired executive
 * director right now. Placed high so the visitor recognizes their problem
 * before they are asked to buy anything.
 */
export const PainSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardsRef.current?.querySelectorAll<HTMLElement>("[data-pain-card]");
      if (!cards?.length) return;

      gsap.fromTo(
        cards,
        { y: 38, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.14,
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
      id="pain"
      className="relative overflow-hidden bg-[#050608] px-6 py-20 text-white md:px-10 lg:px-12 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,122,60,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(70,213,255,0.10),transparent_28%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.46em] text-maxx-orange/78">The Field Problem</p>
          <h2 className="mt-4 text-4xl font-black uppercase leading-[0.92] text-white md:text-6xl">
            People fall through the cracks.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/68 md:text-lg">
            It is not that your team does not care. It is that calls, forms, donors, and volunteer replies
            land in five different places — and follow-up is the first thing that slips.
          </p>
        </div>

        <div ref={cardsRef} className="mt-12 grid gap-5 md:grid-cols-3">
          {maxxPains.map((pain) => (
            <article
              key={pain.id}
              data-pain-card
              className="group flex flex-col rounded-[28px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/40 backdrop-blur-sm transition-colors hover:border-maxx-orange/40"
            >
              <h3 className="text-xl font-black uppercase leading-tight text-white">{pain.title}</h3>
              <p className="mt-4 flex-1 text-sm leading-7 text-white/72">{pain.detail}</p>
              <p className="mt-5 border-l-2 border-maxx-cyan/60 pl-4 text-[11px] uppercase tracking-[0.28em] text-white/55">
                {pain.cost}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
