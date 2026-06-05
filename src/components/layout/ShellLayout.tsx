import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { missionChapters } from "@/config/maxxStoryConfig";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const maxxMusicUrl = new URL("../../../Wojtek Mazolewski Quintet - Beautiful People [Official Video].mp3", import.meta.url).href;

interface ShellLayoutProps {
  children: React.ReactNode;
  introActive?: boolean;
}

export const ShellLayout: React.FC<ShellLayoutProps> = ({ children, introActive = false }) => {
  const [progress, setProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState<(typeof missionChapters)[number]["id"]>(missionChapters[0].id);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(maxxMusicUrl);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.42;
    audioRef.current = audio;

    const handlePlayMusic = () => {
      void audio
        .play()
        .then(() => {
          setMusicPlaying(true);
        })
        .catch(() => {
          setMusicPlaying(false);
        });
    };

    const handlePauseMusic = () => {
      audio.pause();
      setMusicPlaying(false);
    };

    window.addEventListener("maxx:play-music", handlePlayMusic);
    window.addEventListener("maxx:pause-music", handlePauseMusic);

    return () => {
      audio.pause();
      audioRef.current = null;
      window.removeEventListener("maxx:play-music", handlePlayMusic);
      window.removeEventListener("maxx:pause-music", handlePauseMusic);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) {
        setProgress(0);
        return;
      }

      setProgress((window.scrollY / maxScroll) * 100);

      const marker = window.innerHeight * 0.38;
      let nextChapter = missionChapters[0].id;

      for (const chapter of missionChapters) {
        const element = document.getElementById(chapter.id);
        if (!element) continue;

        const rect = element.getBoundingClientRect();
        if (rect.top <= marker) {
          nextChapter = chapter.id;
        }
      }

      setActiveChapter(nextChapter);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToChapter = (chapterId: (typeof missionChapters)[number]["id"]) => {
    const target = document.getElementById(chapterId);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleReplayIntro = () => {
    window.dispatchEvent(new CustomEvent("maxx:start-over"));
  };

  const handleMusicToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      void audio
        .play()
        .then(() => {
          setMusicPlaying(true);
        })
        .catch(() => {
          setMusicPlaying(false);
        });
      return;
    }

    audio.pause();
    setMusicPlaying(false);
  };

  const activeChapterData = missionChapters.find((chapter) => chapter.id === activeChapter) ?? missionChapters[0];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-maxx-bg text-white selection:bg-maxx-cyan selection:text-black">
      <div className="noise-overlay fixed inset-0 z-50 pointer-events-none mix-blend-overlay opacity-30" />
      {!introActive && (
        <>
          <div
            className="fixed left-0 top-0 z-[60] h-[3px] bg-maxx-orange transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />

          <nav className="fixed left-0 top-0 z-40 w-full border-b border-white/10 bg-black/30 px-4 py-4 backdrop-blur-md md:px-6">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.45em] text-white/45">Agent MAXX</div>
                <div className="text-base font-black tracking-tight text-white md:text-xl">006 Field Surface</div>
              </div>

              <div className="hidden items-center gap-5 text-xs uppercase tracking-[0.28em] text-white/65 md:flex">
                {missionChapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    type="button"
                    onClick={() => scrollToChapter(chapter.id)}
                    className={`transition-colors hover:text-maxx-orange ${
                      activeChapter === chapter.id ? "text-maxx-orange" : ""
                    }`}
                  >
                    {chapter.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMusicToggle}
                  className="hidden items-center gap-2 border border-white/15 px-3 py-2 text-[11px] uppercase tracking-[0.32em] text-white/72 transition-colors hover:border-maxx-orange hover:text-maxx-orange lg:inline-flex"
                >
                  {musicPlaying ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  {musicPlaying ? "Music On" : "Music Off"}
                </button>
                <button
                  type="button"
                  onClick={handleReplayIntro}
                  className="hidden items-center gap-2 border border-white/15 px-3 py-2 text-[11px] uppercase tracking-[0.32em] text-white/72 transition-colors hover:border-maxx-cyan hover:text-maxx-cyan lg:inline-flex"
                >
                  <RotateCcw size={14} />
                  Replay 006
                </button>
                <Link
                  to="/signin"
                  className="hidden border border-white/20 px-3 py-2 text-[11px] uppercase tracking-[0.35em] text-white transition-colors hover:border-maxx-orange hover:text-maxx-orange md:inline-flex md:px-4"
                >
                  Operator Login
                </Link>

                <Sheet>
                  <SheetTrigger className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition-colors hover:border-maxx-orange hover:text-maxx-orange md:hidden">
                    <Menu size={18} />
                    <span className="sr-only">Open mission navigation</span>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[84vw] border-white/10 bg-[#060708] p-0 text-white">
                    <SheetHeader className="border-b border-white/10 px-5 py-5">
                      <SheetTitle className="text-lg font-black uppercase tracking-[0.2em] text-white">Agent MAXX</SheetTitle>
                      <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Briefing to field</p>
                    </SheetHeader>

                    <div className="space-y-3 px-5 py-5 text-sm uppercase tracking-[0.24em]">
                      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-[10px] uppercase tracking-[0.38em] text-white/35">Current Chapter</p>
                        <p className="mt-3 text-lg font-black uppercase tracking-[0.16em] text-white">
                          {activeChapterData.label}
                        </p>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-maxx-orange/75">
                          {progress.toFixed(0)}% mission progress
                        </p>
                      </div>
                      {missionChapters.map((chapter) => (
                        <SheetClose asChild key={chapter.id}>
                          <button
                            type="button"
                            onClick={() => scrollToChapter(chapter.id)}
                            className={`block w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                              activeChapter === chapter.id
                                ? "border-maxx-orange/40 bg-maxx-orange/10 text-maxx-orange"
                                : "border-white/10 bg-white/5 text-white/80"
                            }`}
                          >
                            {chapter.label}
                          </button>
                        </SheetClose>
                      ))}
                      <SheetClose asChild>
                        <button
                          type="button"
                          onClick={handleMusicToggle}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/80"
                        >
                          {musicPlaying ? <Volume2 size={15} /> : <VolumeX size={15} />}
                          {musicPlaying ? "Music On" : "Music Off"}
                        </button>
                      </SheetClose>
                      <SheetClose asChild>
                        <button
                          type="button"
                          onClick={handleReplayIntro}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/80"
                        >
                          <RotateCcw size={15} />
                          Replay 006
                        </button>
                      </SheetClose>
                      <Link
                        to="/signin"
                        className="mt-4 block rounded-2xl border border-maxx-orange/40 bg-maxx-orange/10 px-4 py-3 text-maxx-orange"
                      >
                        Operator Login
                      </Link>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </nav>

          <aside className="pointer-events-none fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 xl:block">
            <div className="pointer-events-auto w-52 rounded-[28px] border border-white/10 bg-black/55 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl">
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/35">Mission Progress</p>
              <div className="mt-4 space-y-3">
                {missionChapters.map((chapter, index) => {
                  const isActive = chapter.id === activeChapter;

                  return (
                    <button
                      key={chapter.id}
                      type="button"
                      onClick={() => scrollToChapter(chapter.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all ${
                        isActive
                          ? "bg-white/[0.08] text-white shadow-[0_0_0_1px_rgba(255,122,60,0.28)]"
                          : "text-white/55 hover:bg-white/[0.04] hover:text-white/85"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold uppercase tracking-[0.2em] ${
                          isActive
                            ? "border-maxx-orange/60 bg-maxx-orange text-black"
                            : "border-white/12 bg-white/[0.03] text-white/58"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] text-white/32">{chapter.shortLabel}</p>
                        <p className="mt-1 text-sm font-semibold uppercase tracking-[0.18em]">{chapter.label}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleReplayIntro}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-[11px] uppercase tracking-[0.34em] text-white/75 transition-colors hover:border-maxx-cyan hover:text-maxx-cyan"
              >
                <RotateCcw size={14} />
                Replay 006
              </button>
            </div>
          </aside>
        </>
      )}

      <main aria-hidden={introActive}>{children}</main>

      {!introActive && (
        <footer className="border-t border-white/10 bg-black px-6 py-12 text-center text-xs uppercase tracking-[0.32em] text-white/38">
          <p>Agent MAXX // Outcome-led cinematic operating system</p>
        </footer>
      )}
    </div>
  );
};
