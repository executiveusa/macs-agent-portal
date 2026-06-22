import React, { useEffect, useRef } from "react";
import { maxxDepartmentCards, maxxMotionTiming } from "@/config/maxxStoryConfig";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const OutcomeChaptersScene: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardsRef.current?.querySelectorAll<HTMLElement>("[data-outcome-card]");
      if (!cards?.length) return;

      gsap.fromTo(
        cards,
        { y: 42, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: maxxMotionTiming.chapterDuration,
          stagger: maxxMotionTiming.chapterStagger,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: maxxMotionTiming.chapterStart,
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
      id="departments"
      className="relative overflow-hidden bg-[linear-gradient(180deg,#050607_0%,#080a0c_100%)] px-6 py-20 text-white md:px-10 lg:px-12 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,60,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(70,213,255,0.12),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:80px_80px]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.46em] text-maxx-cyan/78">Run Operations</p>
          <h2 className="mt-4 text-4xl font-black uppercase leading-[0.92] text-white md:text-6xl">
            Keep every revenue move from falling through the cracks.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/68 md:text-lg">
            One command layer keeps leads, content, follow-up, projects, and tools moving in the same direction.
          </p>
        </div>

        <div ref={cardsRef} className="mt-12 grid gap-5 lg:grid-cols-3">
          {maxxDepartmentCards.map((card) => (
            <article
              key={card.id}
              data-outcome-card
              className="group overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/40 backdrop-blur-sm"
            >
              <div className="relative aspect-[16/11] overflow-hidden bg-black/40">
                <img
                  src={card.image}
                  alt={card.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.8),rgba(0,0,0,0.06)_55%)]" />
              </div>
              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[10px] uppercase tracking-[0.42em] text-maxx-orange/78">{card.eyebrow}</p>
                  <span className="text-[10px] uppercase tracking-[0.36em] text-white/30">{card.id}</span>
                </div>
                <h3 className="text-2xl font-black uppercase leading-none text-white">{card.title}</h3>
                <p className="text-sm leading-7 text-white/72">{card.summary}</p>
                <p className="border-l border-maxx-cyan/50 pl-4 text-sm leading-7 text-white/84">
                  {card.outcome}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
