import React, { useEffect, useRef } from 'react';
import { scenesConfig } from '@/config/scenesConfig';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const HeroScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const heroConfig = scenesConfig.find(s => s.id === 'hero');

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax effect
      gsap.to(textRef.current, {
        y: '50%',
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  if (!heroConfig) return null;

  return (
    <section 
      ref={containerRef} 
      className="relative h-screen w-full flex items-center justify-center overflow-hidden"
      id="hero"
    >
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url("${heroConfig.visualContent}")` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-maxx-bg via-maxx-bg/20 to-transparent"></div>
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
      
      <div ref={textRef} className="relative z-10 text-center space-y-4 px-4">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-2xl">
          AGENT <span className="text-maxx-cyan">006</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 max-w-lg mx-auto font-light tracking-wide">
          THE AGENCY IS WATCHING
        </p>
        <div className="pt-8">
           <div className="animate-bounce text-maxx-cyan">
             <span className="text-xs tracking-[0.3em] uppercase opacity-70">Scroll to Initialize</span>
             <br/>↓
           </div>
        </div>
      </div>
    </section>
  );
};
