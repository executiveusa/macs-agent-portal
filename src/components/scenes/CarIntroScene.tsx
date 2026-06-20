import React, { useLayoutEffect, useRef } from "react";
import { scenesConfig } from "@/config/scenesConfig";
import { maxxMotionTiming } from "@/config/maxxStoryConfig";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const CarIntroScene: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const config = scenesConfig.find((scene) => scene.id === "car_intro");

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const image = imageRef.current;
    const copy = copyRef.current;

    if (!section || !image || !copy) return;

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: maxxMotionTiming.carIntroEnd,
          pin: true,
          scrub: maxxMotionTiming.carIntroScrub,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      timeline.fromTo(
        image,
        {
          scale: maxxMotionTiming.carIntroImageStartScale,
          yPercent: maxxMotionTiming.carIntroImageStartY,
          opacity: 0.72,
        },
        {
          scale: 1,
          yPercent: 0,
          opacity: 1,
          duration: 1,
          ease: "power2.out",
        },
        0
      );

      timeline.fromTo(
        copy,
        {
          y: 34,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.62,
          ease: "power2.out",
        },
        0.18
      );
    }, section);

    return () => ctx.revert();
  }, [config?.visualContent]);

  if (!config) return null;

  return (
    <section ref={sectionRef} id="car-intro" className="relative h-screen overflow-hidden bg-[#030405] text-white">
      <img
        ref={imageRef}
        src={config.visualContent}
        alt="Mustang MAXX car reveal"
        className="absolute inset-0 h-full w-full object-cover object-[50%_82%]"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.22),rgba(0,0,0,0.18)_36%,rgba(0,0,0,0.88)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(circle_at_50%_100%,rgba(70,213,255,0.18),transparent_48%)]" />
      <div className="relative z-10 flex h-full items-end px-5 pb-12 md:px-10 md:pb-16">
        <div ref={copyRef} className="w-full max-w-4xl">
          <p className="text-[10px] uppercase tracking-[0.46em] text-maxx-cyan/80">Vehicle reveal</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-black uppercase leading-none text-white md:text-6xl">
            The operating system gets a body.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/72 md:text-lg">
            Agent MAXX moves from briefing to field work: a clear vehicle reveal before the platform modules open.
          </p>
          <div className="mt-8 h-px w-full max-w-xl bg-gradient-to-r from-maxx-orange via-maxx-cyan to-transparent" />
        </div>
      </div>
    </section>
  );
};
