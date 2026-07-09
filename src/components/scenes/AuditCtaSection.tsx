import React, { useEffect, useRef } from "react";
import { maxxBrand } from "@/content/maxxOffer";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * The recovery-audit CTA — the single most important conversion target on
 * the page. Reused as the primary action across hero, pricing, and finale.
 * Anchored at #audit so every "Book the Audit" button lands in one place.
 */
export const AuditCtaSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        innerRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 78%",
            end: "bottom bottom",
            scrub: 0.7,
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
      id="audit"
      className="relative overflow-hidden bg-[#040506] px-6 py-24 text-white md:px-10 lg:px-12"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,122,60,0.16),transparent_38%),radial-gradient(circle_at_50%_100%,rgba(70,213,255,0.12),transparent_34%)]" />

      <div ref={innerRef} className="relative mx-auto max-w-4xl text-center">
        <p className="text-[10px] uppercase tracking-[0.5em] text-maxx-orange/78">{maxxBrand.region}</p>
        <h2 className="mt-5 text-4xl font-black uppercase leading-[0.9] text-white md:text-6xl">
          Book a recovery audit.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/72 md:text-lg">
          We will pull every missed inquiry from the last 90 days, rank them by recoverability, and show you
          exactly where the support is leaking — before you spend a dollar on a system.
        </p>

        <form
          className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget as HTMLFormElement;
            const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
            const subject = encodeURIComponent("Recovery Audit Request — MAXX");
            const body = encodeURIComponent(
              `We would like a recovery audit.\n\nOrganization: \nRole: \nEmail: ${email || ""}\nBest time to reach: `
            );
            window.location.href = `mailto:hello@macsdigitalmedia.com?subject=${subject}&body=${body}`;
          }}
        >
          <input
            type="email"
            name="email"
            required
            placeholder="Your work email"
            aria-label="Your work email"
            className="flex-1 rounded-none border border-white/20 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-maxx-orange"
          />
          <button
            type="submit"
            className="shrink-0 bg-maxx-orange px-6 py-3 text-xs font-bold uppercase tracking-[0.32em] text-black transition-colors hover:bg-white"
          >
            Book the Audit
          </button>
        </form>

        <p className="mt-5 text-[11px] uppercase tracking-[0.3em] text-white/40">
          Or grab the free missed follow-up checklist first.
        </p>
        <a
          href="#how-it-works"
          className="mt-3 inline-block border-b border-white/40 pb-1 text-sm uppercase tracking-[0.28em] text-white/80 transition-colors hover:border-maxx-cyan hover:text-maxx-cyan"
        >
          Get the checklist
        </a>

        <p className="mt-10 text-[10px] uppercase tracking-[0.4em] text-white/30">{maxxBrand.poweredBy}</p>
      </div>
    </section>
  );
};
