import React, { useEffect, useRef } from 'react';
import { scenesConfig } from '@/config/scenesConfig';
import { maxxStoryConfig } from '@/config/maxxStoryConfig';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const BriefingScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const config = scenesConfig.find(s => s.id === 'briefing');
  const { slideInDuration, scrubAmount, startOffset } = maxxStoryConfig.briefing;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(imageRef.current, {
        x: -100,
        opacity: 0.65,
        duration: slideInDuration,
        scrollTrigger: {
          trigger: containerRef.current,
          start: `top ${startOffset}`,
          end: 'bottom bottom',
          scrub: scrubAmount,
        },
      });

      gsap.from(textRef.current, {
        x: 100,
        opacity: 0.75,
        delay: 0.2,
        duration: slideInDuration,
        scrollTrigger: {
          trigger: containerRef.current,
          start: `top ${startOffset}`,
          end: 'bottom bottom',
          scrub: scrubAmount,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [slideInDuration, scrubAmount, startOffset]);

  if (!config) return null;

  return (
    <section id="briefing" ref={containerRef} className="py-32 px-6 md:px-20 min-h-[80vh] flex flex-col md:flex-row items-center gap-12 bg-maxx-secondary relative overflow-hidden">
       {/* Background accent */}
       <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-black/50 to-transparent pointer-events-none" />

       <div className="flex-1 relative z-10">
         <div className="relative border-4 border-maxx-paper p-2 bg-white -rotate-2 transform transition-transform hover:rotate-0 duration-500 shadow-2xl">
            <img 
              ref={imageRef} 
              src={config.visualContent} 
              alt="Agent MAXX lead dossier"
              className="w-full grayscale contrast-125 sepia-[.3]"
            />
            <div className="absolute bottom-4 right-4 bg-maxx-ink text-maxx-paper px-3 py-1 font-mono text-xs">
              TARGETING // LIVE SIGNAL
            </div>
         </div>
       </div>

       <div className="flex-1 space-y-8 relative z-10 text-right md:text-left" ref={textRef}>
          <p className="text-[10px] uppercase tracking-[0.46em] text-maxx-cyan/80">Mission 01 // Recovery Audit</p>
          <h2 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-tighter">Find the follow-ups that slipped.</h2>
          <div className="space-y-4 text-gray-400 text-lg leading-relaxed font-light">
            <p>
              MAXX scans every missed call, form, DM, and stale donor reply from the last 90 days and ranks them by how recoverable each one is — before a single message goes out.
            </p>
            <p>
              From CRM notes, inboxes, voicemails, and directories, MAXX builds the first dossier: who slipped, why, and the warmest next step.
            </p>
          </div>
          <div className="flex gap-4">
             <a href="#audit" className="px-8 py-3 bg-maxx-cyan text-black font-bold uppercase hover:bg-white transition-colors">
               Book the Audit
             </a>
          </div>
       </div>
    </section>
  );
};
