import React, { useEffect, useRef } from "react";
import { maxxHowItWorks } from "@/content/maxxOffer";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * How it works — five steps that make the offer concrete and credible.
 * This is the "likelihood" lever of the Hormozi value equation: prove the
 * path is real before asking for the buy.
 */
export const HowItWorksSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const steps = stepsRef.current?.querySelectorAll<HTMLElement>("[data-step]");
      if (!steps?.length) return;

      gsap.fromTo(
        steps,
        { x: -28, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
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
      id="how-it-works"
      className="relative overflow-hidden bg-[linear-gradient(180deg,#060709_0%,#0a0c10_100%)] px-6 py-20 text-white md:px-10 lg:px-12 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(70,213,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,122,60,0.10),transparent_28%)]" />

      <div className="relative mx-auto max-w-5xl">
        <div className="max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.46em] text-maxx-cyan/78">The Mission Plan</p>
          <h2 className="mt-4 text-4xl font-black uppercase leading-[0.92] text-white md:text-6xl">
            Five steps to a follow-up system you own.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/68 md:text-lg">
            No black box. No vague "AI strategy." A real recovery sprint that produces
            conversations before the full install is even complete.
          </p>
        </div>

        <ol ref={stepsRef} className="mt-12 space-y-4">
          {maxxHowItWorks.map((step) => (
            <li
              key={step.id}
              data-step
              className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-6 md:flex-row md:items-center md:gap-8"
            >
              <div className="flex shrink-0 items-center gap-4 md:w-56">
                <span className="grid h-12 w-12 place-items-center rounded-full border border-maxx-orange/50 bg-maxx-orange/10 text-sm font-black text-maxx-orange">
                  {step.step.split(" ")[1]}
                </span>
                <span className="text-[10px] uppercase tracking-[0.4em] text-white/40">{step.step}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black uppercase leading-none text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/72">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
