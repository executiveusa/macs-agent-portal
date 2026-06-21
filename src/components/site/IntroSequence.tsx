import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { countdownFrames, maxxMotionTiming } from "@/config/maxxStoryConfig";

interface IntroSequenceProps {
  onComplete: () => void;
}

export const IntroSequence = ({ onComplete }: IntroSequenceProps) => {
  const [phase, setPhase] = useState<"briefing" | "countdown" | "closing" | "complete">("briefing");
  const [index, setIndex] = useState(0);
  const exitTimerRef = useRef<number | null>(null);
  const skipButtonRef = useRef<HTMLButtonElement>(null);
  const beginButtonRef = useRef<HTMLButtonElement>(null);
  const frames = useMemo(() => countdownFrames, []);

  const requestMusicPlayback = useCallback(() => {
    window.dispatchEvent(new CustomEvent("maxx:play-music"));
  }, []);

  const completeSequence = useCallback(() => {
    requestMusicPlayback();
    setPhase("closing");

    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
    }

    exitTimerRef.current = window.setTimeout(() => {
      exitTimerRef.current = null;
      setPhase("complete");
      onComplete();
    }, maxxMotionTiming.introExitDuration);
  }, [onComplete, requestMusicPlayback]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = phase === "complete" ? originalOverflow : "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "countdown") return;

    if (index >= frames.length) {
      const completeTimer = window.setTimeout(() => {
        completeSequence();
      }, maxxMotionTiming.introFrameDuration);

      return () => window.clearTimeout(completeTimer);
    }

    const timer = window.setTimeout(() => {
      setIndex((current) => current + 1);
    }, maxxMotionTiming.introFrameDuration);

    return () => window.clearTimeout(timer);
  }, [completeSequence, frames.length, index, phase]);

  useEffect(() => {
    if (phase !== "complete") {
      skipButtonRef.current?.focus();
    }
  }, [phase]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        completeSequence();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusables = [skipButtonRef.current, beginButtonRef.current].filter(
        (element): element is HTMLButtonElement => Boolean(element)
      );

      if (focusables.length === 0) {
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [completeSequence]);

  if (phase === "complete") return null;

  const currentFrame = frames[Math.min(index, frames.length - 1)];
  const isClosing = phase === "closing";

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden bg-black text-white transition-[opacity,transform] duration-300 ease-out ${
        isClosing ? "pointer-events-none scale-[1.01] opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,122,60,0.22),transparent_35%),radial-gradient(circle_at_bottom,rgba(70,213,255,0.16),transparent_28%)]" />
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.03),transparent)]" />
      </div>
      <button
        ref={skipButtonRef}
        type="button"
        onClick={completeSequence}
        className="absolute right-6 top-6 z-10 border border-white/15 px-4 py-2 text-[10px] uppercase tracking-[0.4em] text-white/65 transition-colors hover:border-maxx-cyan hover:text-maxx-cyan md:right-8 md:top-8"
      >
        Skip Intro
      </button>

      {phase === "briefing" ? (
        <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
          <div className="mb-8 flex items-center gap-3 text-[10px] uppercase tracking-[0.55em] text-white/55">
            <span className="h-px w-16 bg-maxx-orange/70" />
            MAXX Protocol
            <span className="h-px w-16 bg-maxx-orange/70" />
          </div>
          <p className="max-w-3xl text-balance text-3xl font-light leading-tight text-white/90 md:text-5xl">
            Maxx, Agent Maxx.
          </p>
          <p className="mt-5 text-xs uppercase tracking-[0.45em] text-white/45">
            Field Briefing
          </p>
          <p className="mt-8 text-[10px] uppercase tracking-[0.38em] text-white/32">Press escape to skip intro</p>
          <button
            ref={beginButtonRef}
            type="button"
            onClick={() => {
              requestMusicPlayback();
              setIndex(0);
              setPhase("countdown");
            }}
            className="mt-14 border-b border-white/70 pb-2 text-sm uppercase tracking-[0.5em] text-white transition-colors hover:text-maxx-orange"
          >
            Activate MAXX
          </button>
        </div>
      ) : (
        <div className="relative flex h-full flex-col items-center justify-center px-6">
          <div className="absolute top-8 text-[10px] uppercase tracking-[0.65em] text-white/35 md:top-12">
            006 Protocol
          </div>
          <div className="relative">
            <div className="absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-white/15" />
            <div
              className="relative text-center font-black leading-none tracking-[0.14em] text-white/95"
              style={{ fontSize: "clamp(5rem, 24vw, 18rem)" }}
            >
              {currentFrame}
            </div>
          </div>
          <div className="mt-6 grid grid-cols-6 gap-2">
            {frames.map((frame, frameIndex) => (
              <span
                key={frame}
                className={`h-1.5 w-8 rounded-full transition-colors duration-200 ${
                  frameIndex <= index ? "bg-maxx-orange" : "bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
