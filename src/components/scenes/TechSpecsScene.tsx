import React, { useEffect, useMemo, useRef } from "react";
import { scenesConfig } from "@/config/scenesConfig";
import { maxxMotionTiming } from "@/config/maxxStoryConfig";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const TechSpecsScene: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const blueprintRef = useRef<HTMLDivElement>(null);
  const featureRefs = useRef<HTMLDivElement[]>([]);

  const config = useMemo(() => scenesConfig.find((scene) => scene.id === "tech_specs"), []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        blueprintRef.current,
        { scale: 0.97, opacity: 0.72 },
        {
          scale: 1,
          opacity: 1,
          duration: maxxMotionTiming.techSpecsCardDuration,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: maxxMotionTiming.techSpecsStart,
            end: maxxMotionTiming.techSpecsEnd,
            scrub: maxxMotionTiming.techSpecsScrub,
            invalidateOnRefresh: true,
          },
        }
      );

      gsap.fromTo(
        featureRefs.current,
        { x: 28, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: maxxMotionTiming.techSpecsCardDuration,
          stagger: maxxMotionTiming.techSpecsStagger,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: maxxMotionTiming.techSpecsStart,
            end: maxxMotionTiming.techSpecsEnd,
            scrub: maxxMotionTiming.techSpecsScrub,
            invalidateOnRefresh: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  if (!config?.features?.length) return null;

  return (
    <section
      ref={sectionRef}
      id="tech_specs"
      className="relative overflow-hidden bg-[linear-gradient(180deg,#05090f_0%,#040506_100%)] px-6 py-20 text-white md:px-10 lg:px-12 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(70,213,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,122,60,0.1),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-22 [background-image:linear-gradient(rgba(109,209,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(109,209,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.46em] text-maxx-cyan/78">Build Systems</p>
          <h2 className="mt-4 text-4xl font-black uppercase leading-[0.92] text-white md:text-6xl">
            Turn repeatable work into an operating system.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/68 md:text-lg">
            Build websites, dashboards, automations, and agent workflows that keep the operation moving after the first conversation.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div
            ref={blueprintRef}
            className="relative min-h-[520px] overflow-hidden rounded-[34px] border border-cyan-300/15 bg-[#07111d] shadow-2xl shadow-black/40"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(70,213,255,0.18),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(255,122,60,0.16),transparent_26%)]" />
            <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(109,209,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(109,209,255,0.12)_1px,transparent_1px)] [background-size:56px_56px]" />

            <div className="relative z-10 flex h-full flex-col justify-between p-6 md:p-8">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.45em] text-maxx-cyan/70">System dossier</p>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-white/68">
                    The operating surface stays clear while the system underneath gets more capable.
                  </p>
                </div>
                <div className="rounded-2xl border border-cyan-300/20 bg-black/30 px-4 py-3 text-right">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-white/36">Blueprint</p>
                  <p className="mt-2 text-sm font-black uppercase tracking-[0.2em] text-white">MAXX-006</p>
                </div>
              </div>

              <div className="relative mx-auto flex w-full max-w-4xl items-center justify-center py-8">
                <div className="absolute left-1/2 top-1/2 h-[1px] w-[76%] -translate-x-1/2 bg-cyan-200/30" />
                <div className="absolute left-1/2 top-1/2 h-[76%] w-[1px] -translate-x-1/2 -translate-y-1/2 bg-cyan-200/20" />
                <img
                  src={config.visualContent}
                  alt={config.title}
                  className="max-h-[360px] w-full max-w-4xl object-contain opacity-35 mix-blend-screen saturate-0 contrast-125"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />

                <div className="absolute left-[14%] top-[24%] rounded-full border border-cyan-200/50 bg-black/55 px-3 py-1 text-[10px] uppercase tracking-[0.4em] text-cyan-100">
                  Websites &amp; Landing Pages
                </div>
                <div className="absolute left-[20%] bottom-[18%] rounded-full border border-cyan-200/50 bg-black/55 px-3 py-1 text-[10px] uppercase tracking-[0.4em] text-cyan-100">
                  Automations &amp; Workflows
                </div>
                <div className="absolute right-[18%] top-[22%] rounded-full border border-cyan-200/50 bg-black/55 px-3 py-1 text-[10px] uppercase tracking-[0.4em] text-cyan-100">
                  Custom Agent Skills
                </div>
                <div className="absolute right-[12%] bottom-[20%] rounded-full border border-cyan-200/50 bg-black/55 px-3 py-1 text-[10px] uppercase tracking-[0.4em] text-cyan-100">
                  Build the System
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cyan-300/15 pt-4 text-[10px] uppercase tracking-[0.42em] text-white/40">
                <span>System map preserved</span>
                <span>Workflow layer visible</span>
                <span>Operator logic first</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {config.features.map((feature, index) => (
              <article
                key={feature.id}
                ref={(node) => {
                  if (node) featureRefs.current[index] = node;
                }}
                className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.42em] text-maxx-orange/78">
                      REF: 007-{feature.original_007_ref?.toUpperCase()}
                    </p>
                    <h3 className="mt-3 text-2xl font-black uppercase leading-none text-white">{feature.label}</h3>
                  </div>
                  <div className="rounded-full border border-cyan-200/20 bg-cyan-200/8 px-3 py-2 text-[10px] uppercase tracking-[0.45em] text-cyan-100">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-white/72">{feature.description}</p>
              </article>
            ))}

            <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] p-6">
              <p className="text-[10px] uppercase tracking-[0.45em] text-white/36">Field note</p>
              <p className="mt-4 text-lg leading-8 text-white/86">
                Mapped. The story stays cinematic while the system stays usable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
