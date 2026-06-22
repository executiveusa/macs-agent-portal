import React, { useEffect, useRef } from "react";
import { scenesConfig } from "@/config/scenesConfig";
import { maxxHeroBeats, maxxMotionTiming } from "@/config/maxxStoryConfig";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const HeroScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const heroConfig = scenesConfig.find((scene) => scene.id === "hero");

  useEffect(() => {
    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.to(textRef.current, {
          y: maxxMotionTiming.heroTextShift,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        gsap.to(imageRef.current, {
          scale: maxxMotionTiming.heroImageScale,
          yPercent: maxxMotionTiming.heroImageY,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
      });

      mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.to(textRef.current, {
          y: "6%",
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.45,
            invalidateOnRefresh: true,
          },
        });

        gsap.to(imageRef.current, {
          scale: 1.01,
          yPercent: 1,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.45,
            invalidateOnRefresh: true,
          },
        });
      });
    }, containerRef);

    return () => {
      mm.revert();
      ctx.revert();
    };
  }, []);

  if (!heroConfig) return null;

  return (
    <section
      ref={containerRef}
      className="relative isolate overflow-hidden bg-[#040507] px-6 pb-16 pt-24 text-white md:px-8 lg:min-h-dvh lg:px-10 lg:pb-20 lg:pt-28"
      id="hero"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,60,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(70,213,255,0.14),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:72px_72px]" />

      <div className="relative mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-center">
        <div ref={textRef} className="relative z-10 max-w-3xl">
          <div className="mb-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.5em] text-white/55">
            <span className="h-px w-12 bg-maxx-orange/80" />
            {heroConfig.title}
          </div>
          <h1 className="max-w-5xl text-5xl font-black uppercase leading-[0.88] text-white md:text-7xl xl:text-8xl">
            1 Agent.
            <br />
            Many Skills.
            <br />
            Maxximum Possibilities.
          </h1>
          <p className="mt-6 max-w-2xl text-base font-light leading-7 text-white/72 md:text-xl md:leading-8">
            Agent MAXX is your AI operator for lead generation, content creation, follow-up, sales support, and business automation.
          </p>

          <div className="mt-10 grid gap-3 md:max-w-3xl md:grid-cols-3">
            {maxxHeroBeats.map((beat) => (
              <div
                key={beat}
                className="border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-6 text-white/72 backdrop-blur-sm"
              >
                {beat}
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-4">
            <a
              href="#briefing"
              className="bg-maxx-orange px-5 py-3 text-xs font-bold uppercase tracking-[0.35em] text-black transition-colors hover:bg-white"
            >
              See What MAXX Can Do
            </a>
            <span className="text-[10px] uppercase tracking-[0.45em] text-white/40">
              Scroll to unlock the skill stack
            </span>
          </div>
        </div>

        <div ref={imageRef} className="relative mx-auto w-full max-w-[540px] lg:justify-self-end">
          <div className="pointer-events-none absolute -inset-6 rounded-[40px] bg-[radial-gradient(circle_at_top,rgba(255,122,60,0.18),transparent_35%),radial-gradient(circle_at_bottom,rgba(70,213,255,0.14),transparent_28%)] blur-3xl" />
          <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4 shadow-2xl shadow-black/60">
            <div className="rounded-[28px] border border-white/10 bg-black/35 p-3">
              <img
                src={heroConfig.visualContent}
                alt="Agent MAXX full-body reveal"
                className="mx-auto h-auto w-full max-w-[460px] object-contain object-bottom drop-shadow-[0_30px_70px_rgba(0,0,0,0.55)]"
                loading="eager"
                decoding="async"
                draggable={false}
              />
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/10 pt-4 text-[10px] uppercase tracking-[0.45em] text-white/45">
              <span>Agent Online</span>
              <span>Skills Armed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
