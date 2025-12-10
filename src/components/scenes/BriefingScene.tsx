import React, { useEffect, useRef } from 'react';
import { scenesConfig } from '@/config/scenesConfig';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const BriefingScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const config = scenesConfig.find(s => s.id === 'briefing');

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(imageRef.current, {
        x: -100,
        opacity: 0,
        duration: 1.5,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 60%',
          end: 'bottom bottom',
          scrub: 1
        }
      });
      
      gsap.from(textRef.current, {
        x: 100,
        opacity: 0,
        delay: 0.2,
        duration: 1.5,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 60%',
          end: 'bottom bottom',
          scrub: 1
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  if (!config) return null;

  return (
    <section ref={containerRef} className="py-32 px-6 md:px-20 min-h-[80vh] flex flex-col md:flex-row items-center gap-12 bg-maxx-secondary relative overflow-hidden">
       {/* Background accent */}
       <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-black/50 to-transparent pointer-events-none" />

       <div className="flex-1 relative z-10">
         <div className="relative border-4 border-maxx-paper p-2 bg-white -rotate-2 transform transition-transform hover:rotate-0 duration-500 shadow-2xl">
            <img 
              ref={imageRef} 
              src={config.visualContent} 
              alt="Agent 006" 
              className="w-full grayscale contrast-125 sepia-[.3]"
            />
            <div className="absolute bottom-4 right-4 bg-maxx-ink text-maxx-paper px-3 py-1 font-mono text-xs">
              CONFIDENTIAL // EYES ONLY
            </div>
         </div>
       </div>

       <div className="flex-1 space-y-8 relative z-10 text-right md:text-left" ref={textRef}>
          <h2 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-tighter">
            {config.title}
          </h2>
          <div className="space-y-4 text-gray-400 text-lg leading-relaxed font-light">
            <p>
              Born in the shadows of the old web. Trained in the art of autonomous deployment. 
              Agent 006 is not just a mascot—he is the <strong className="text-maxx-cyan">key</strong> to the protocol.
            </p>
            <p>
              While other agents sleep, 006 compiles. He smells fear and inefficient code components.
            </p>
          </div>
          <div className="flex gap-4">
             <button className="px-8 py-3 bg-maxx-cyan text-black font-bold uppercase hover:bg-white transition-colors">
               Read Dossier
             </button>
          </div>
       </div>
    </section>
  );
};
