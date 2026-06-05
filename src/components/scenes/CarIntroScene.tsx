import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scenesConfig } from '@/config/scenesConfig';
import { maxxStoryConfig } from '@/config/maxxStoryConfig';

gsap.registerPlugin(ScrollTrigger);

export const CarIntroScene: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const config = scenesConfig.find(s => s.id === 'car_intro');
  const { pinLength, scrubAmount, overlayOpacityStart, overlayOpacityEnd } = maxxStoryConfig.carIntro;

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: pinLength,
          pin: true,
          scrub: scrubAmount,
          anticipatePin: 1,
        },
      });

      // Darken overlay lifts to reveal the car
      tl.to(overlayRef.current, {
        opacity: overlayOpacityEnd,
        ease: 'power2.out',
      }, 0);

      // Image scales up slightly from resting position
      tl.fromTo(
        imageRef.current,
        { scale: 1.08, y: 20 },
        { scale: 1, y: 0, ease: 'power2.out' },
        0
      );

      // Title fades in mid-reveal
      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, ease: 'power2.out' },
        0.4
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [pinLength, scrubAmount, overlayOpacityEnd]);

  if (!config) return null;

  return (
    <section
      ref={sectionRef}
      id="car-intro"
      className="relative h-screen w-full bg-black overflow-hidden flex items-center justify-center"
    >
      {/* Car image — object-contain keeps full vehicle in frame */}
      <img
        ref={imageRef}
        src={config.visualContent}
        alt="Mustang MAXX — full vehicle cinematic reveal"
        className="absolute inset-0 w-full h-full object-contain"
        style={{ filter: 'contrast(1.1) brightness(0.85)' }}
      />

      {/* Noir overlay — lifts as scroll progresses */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-maxx-bg pointer-events-none"
        style={{ opacity: overlayOpacityStart }}
      />

      {/* Wet-pavement reflection gradient at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent" />

      {/* Orange accent line — left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-maxx-orange to-transparent opacity-60" />

      {/* Cyan accent line — right edge */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-maxx-cyan to-transparent opacity-40" />

      {/* Title block */}
      <div
        ref={titleRef}
        className="relative z-10 text-center space-y-2 opacity-0 mt-auto mb-16"
      >
        <div className="font-mono text-xs tracking-[0.5em] text-maxx-cyan/70 uppercase">
          ASSET DECLASSIFIED
        </div>
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white drop-shadow-2xl">
          {config.title}
        </h2>
        <p className="text-gray-400 text-sm tracking-widest font-light">
          {config.interaction}
        </p>
      </div>
    </section>
  );
};
