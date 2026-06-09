import React, { useEffect, useRef } from "react";
import { maxxMissionBeats, maxxMotionTiming } from "@/config/maxxStoryConfig";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const FinalMissionScene: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headlineRef.current, {
        y: 36,
        opacity: 0,
        duration: maxxMotionTiming.finaleCopyDuration,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: maxxMotionTiming.finaleStart,
          end: "bottom bottom",
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });

      gsap.fromTo(
        cardRefs.current,
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: maxxMotionTiming.finaleCardDuration,
          stagger: maxxMotionTiming.finaleStagger,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 68%",
            end: "bottom bottom",
            scrub: 0.8,
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
      id="mission"
      className="relative overflow-hidden bg-[#040506] px-6 py-20 text-white md:px-10 lg:px-12 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(70,213,255,0.12),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,122,60,0.12),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:84px_84px]" />

      <div className="relative mx-auto max-w-7xl">
        <div ref={headlineRef} className="max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.46em] text-maxx-orange/78">Closing act</p>
          <h2 className="mt-4 text-4xl font-black uppercase leading-[0.92] text-white md:text-6xl">
            The mission is a repeatable outcome.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/68 md:text-lg">
            The story ends where the product begins: a clean handoff from discovery to action, with every chapter
            pointing back to the same result.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {maxxMissionBeats.map((beat, index) => (
            <div
              key={beat}
              ref={(node) => {
                if (node) cardRefs.current[index] = node;
              }}
              className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30"
            >
              <p className="text-[10px] uppercase tracking-[0.42em] text-maxx-cyan/70">Mission beat {index + 1}</p>
              <p className="mt-4 text-lg leading-8 text-white/84">{beat}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-8 md:p-10">
          <p className="text-[10px] uppercase tracking-[0.46em] text-white/40">Final protocol</p>
          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <h3 className="text-3xl font-black uppercase leading-none text-white md:text-5xl">
                Hand the user a path they can actually finish.
              </h3>
              <p className="mt-4 text-sm leading-7 text-white/68 md:text-base">
                The experience stays cinematic, but the outcome is plain: less friction, more follow-through, and a
                stronger next action.
              </p>
            </div>
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center border border-maxx-orange/70 bg-maxx-orange px-5 py-3 text-xs font-bold uppercase tracking-[0.36em] text-black transition-colors hover:bg-white"
            >
              Enter the Agency
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
