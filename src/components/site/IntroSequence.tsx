import React, { useCallback, useEffect, useRef, useState } from 'react';
import { maxxStoryConfig } from '@/config/maxxStoryConfig';

interface IntroSequenceProps {
  onComplete: () => void;
}

const FRAMES = [
  { label: 'INITIALIZING PROTOCOL', sub: 'Establishing secure channel...' },
  { label: 'IDENTITY VERIFIED', sub: 'Agent 006 clearance confirmed.' },
  { label: 'MISSION LOADING', sub: 'Retrieving operational brief...' },
  { label: 'MAXX-POST', sub: 'The Agency is watching.' },
];

export const IntroSequence: React.FC<IntroSequenceProps> = ({ onComplete }) => {
  const { seenKey, countdownFrames, durationMs, skipKey } = maxxStoryConfig.intro;
  const [frame, setFrame] = useState(0);
  const [visible, setVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dismiss = useCallback(() => {
    localStorage.setItem(seenKey, '1');
    setVisible(false);
    setTimeout(onComplete, 600);
  }, [onComplete, seenKey]);

  useEffect(() => {
    if (localStorage.getItem(seenKey)) {
      onComplete();
      return;
    }

    const frameMs = durationMs / countdownFrames;
    intervalRef.current = setInterval(() => {
      setFrame(prev => {
        if (prev >= countdownFrames - 1) {
          clearInterval(intervalRef.current!);
          dismiss();
          return prev;
        }
        return prev + 1;
      });
    }, frameMs);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [countdownFrames, dismiss, durationMs, onComplete, seenKey]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === skipKey) dismiss();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dismiss, skipKey]);

  if (!visible) return null;

  const current = FRAMES[Math.min(frame, FRAMES.length - 1)];

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="MAXX-POST intro sequence"
      className="fixed inset-0 z-[9999] bg-maxx-bg flex flex-col items-center justify-center transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* Noise texture */}
      <div className="absolute inset-0 noise-overlay opacity-40 pointer-events-none" />

      {/* Scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="w-full h-px bg-maxx-cyan/30 animate-pulse"
          style={{ boxShadow: '0 0 12px 2px rgba(70,213,255,0.4)', top: `${(frame / countdownFrames) * 100}%` }}
        />
      </div>

      <div className="relative z-10 text-center space-y-6 px-6 max-w-xl">
        {/* Frame counter */}
        <div className="font-mono text-xs tracking-[0.4em] text-maxx-cyan/60 uppercase">
          FRAME {frame + 1} / {countdownFrames}
        </div>

        {/* Main label */}
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white transition-all duration-500">
          {current.label}
        </h1>

        {/* Sub text */}
        <p className="text-gray-400 font-mono text-sm tracking-widest">
          {current.sub}
        </p>

        {/* Progress bar */}
        <div className="w-full h-px bg-white/10 relative overflow-hidden">
          <div
            className="h-full bg-maxx-cyan transition-all duration-700"
            style={{ width: `${((frame + 1) / countdownFrames) * 100}%` }}
          />
        </div>

        {/* Skip hint */}
        <button
          onClick={dismiss}
          className="text-xs text-gray-600 hover:text-gray-400 font-mono tracking-widest uppercase transition-colors"
        >
          Press {skipKey} or tap to skip
        </button>
      </div>
    </div>
  );
};
