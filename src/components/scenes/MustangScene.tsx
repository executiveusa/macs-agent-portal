import React, { useEffect, useRef, useState } from 'react';
import { scenesConfig } from '@/config/scenesConfig';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Plus } from 'lucide-react';

export const MustangScene: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  
  const config = scenesConfig.find(s => s.id === 'the_car');

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Pin the section
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=300%", // 3 screens long
          pin: true,
          scrub: 1,
          anticipatePin: 1
        }
      });

      // Simple horizontal drift or zoom to simulate 007 exploration
      tl.to(carRef.current, {
        scale: 1.1,
        x: '-5%',
        ease: "none"
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  if (!config || !config.features) return null;

  return (
    <section ref={sectionRef} className="h-screen w-full bg-maxx-bg relative flex flex-col justify-center overflow-hidden" id="car">
      
      {/* Background Graphic */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="text-[20vw] font-bold text-white border-text">MAXX</div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 h-full flex flex-col justify-center">
        
        <div className="text-center mb-8">
            <h2 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-widest">{config.title}</h2>
        </div>

        {/* The Car Container */}
        <div ref={carRef} className="relative w-full aspect-video md:aspect-[21/9] bg-black/50 border border-gray-800 rounded-lg overflow-hidden group shadow-2xl shadow-maxx-cyan/10">
           <img 
             src={config.visualContent} 
             alt="Mustang MAXX" 
             className="w-full h-full object-cover opacity-80"
           />
           
           {/* Hotspots Overlay */}
           <div ref={featuresRef} className="absolute inset-0">
              {/* Manually positioning hotspots based on rough guess - in PROD this needs exact coordinates */}
              {config.features.map((feature, i) => {
                 // Mock positions
                 const positions = [
                   { top: '60%', left: '45%' }, // Console
                   { top: '80%', left: '20%' }, // Plates
                   { top: '40%', left: '50%' }, // Eject
                   { top: '75%', left: '85%' }, // Drone
                 ];
                 const pos = positions[i] || { top: '50%', left: '50%' };

                 return (
                   <button
                     key={feature.id}
                     className="absolute w-8 h-8 -ml-4 -mt-4 bg-maxx-cyan/20 border border-maxx-cyan rounded-full flex items-center justify-center text-maxx-cyan hover:bg-maxx-cyan hover:text-black transition-all duration-300 animate-pulse hover:animate-none z-20 group/hotspot"
                     style={pos}
                     onClick={() => setActiveFeature(activeFeature === feature.id ? null : feature.id)}
                   >
                     <Plus size={16} />
                     
                     {/* Tooltip on Hover/Click */}
                     <div className={`absolute left-10 w-64 bg-black/90 border border-maxx-cyan p-4 backdrop-blur-md text-left transition-all duration-300 ${activeFeature === feature.id ? 'opacity-100 visible translate-x-0' : 'opacity-0 invisible -translate-x-4 group-hover/hotspot:opacity-100 group-hover/hotspot:visible group-hover/hotspot:translate-x-0'}`}>
                        <h4 className="text-maxx-cyan font-bold text-sm uppercase mb-1">{feature.label}</h4>
                        <p className="text-xs text-gray-300">{feature.description}</p>
                        <div className="mt-2 text-[10px] text-gray-500 font-mono">
                          REF: 007-{feature.original_007_ref?.toUpperCase()}
                        </div>
                     </div>
                   </button>
                 );
              })}
           </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm font-mono">SCROLL TO INSPECT ORDNANCE</p>
        </div>

      </div>
    </section>
  );
};
