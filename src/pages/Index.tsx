import { Suspense, lazy, useEffect, useState } from "react";
import { ShellLayout } from "@/components/layout/ShellLayout";
import { HeroScene } from "@/components/scenes/HeroScene";
import { IntroSequence } from "@/components/site/IntroSequence";

const BriefingScene = lazy(async () => {
  const module = await import("@/components/scenes/BriefingScene");
  return { default: module.BriefingScene };
});

const MustangScene = lazy(async () => {
  const module = await import("@/components/scenes/MustangScene");
  return { default: module.MustangScene };
});

const CarIntroScene = lazy(async () => {
  const module = await import("@/components/scenes/CarIntroScene");
  return { default: module.CarIntroScene };
});

const OutcomeChaptersScene = lazy(async () => {
  const module = await import("@/components/scenes/OutcomeChaptersScene");
  return { default: module.OutcomeChaptersScene };
});

const FinalMissionScene = lazy(async () => {
  const module = await import("@/components/scenes/FinalMissionScene");
  return { default: module.FinalMissionScene };
});

const SceneFallback = ({
  id,
  eyebrow,
  title,
  height = "min-h-[72vh]",
}: {
  id: string;
  eyebrow: string;
  title: string;
  height?: string;
}) => (
  <section
    id={id}
    className={`relative flex items-center overflow-hidden bg-[#060708] px-6 py-24 text-white md:px-10 ${height}`}
  >
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,60,0.12),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(70,213,255,0.10),transparent_30%)]" />
    <div className="relative mx-auto w-full max-w-6xl">
      <p className="text-[10px] uppercase tracking-[0.42em] text-maxx-orange/75">{eyebrow}</p>
      <h2 className="mt-5 max-w-3xl text-4xl font-black uppercase leading-[0.94] text-white/90 md:text-6xl">
        {title}
      </h2>
      <div className="mt-8 h-2 w-36 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/3 animate-[pulse_1.6s_cubic-bezier(0.4,0,0.6,1)_infinite] rounded-full bg-maxx-orange/80" />
      </div>
      <p className="mt-5 max-w-xl text-sm uppercase tracking-[0.28em] text-white/38">
        Loading the next chapter into the mission map.
      </p>
    </div>
  </section>
);

const Index = () => {
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    const hasSeenIntro = window.sessionStorage.getItem("maxx_intro_seen") === "1";
    setIntroComplete(hasSeenIntro);
  }, []);

  useEffect(() => {
    const handleStartOver = () => {
      window.sessionStorage.removeItem("maxx_intro_seen");
      window.scrollTo({ top: 0, behavior: "auto" });
      setIntroComplete(false);
    };

    window.addEventListener("maxx:start-over", handleStartOver);

    return () => window.removeEventListener("maxx:start-over", handleStartOver);
  }, []);

  const handleIntroComplete = () => {
    window.sessionStorage.setItem("maxx_intro_seen", "1");
    setIntroComplete(true);
  };

  return (
    <>
      <ShellLayout introActive={!introComplete}>
        <HeroScene />
        <Suspense fallback={<SceneFallback id="briefing" eyebrow="Briefing" title="Loading command context." />}>
          <BriefingScene />
        </Suspense>
        <Suspense fallback={<SceneFallback id="car-intro" eyebrow="Vehicle" title="Loading the field reveal." height="min-h-screen" />}>
          <CarIntroScene />
        </Suspense>
        <Suspense fallback={<SceneFallback id="car" eyebrow="Platform" title="Loading the MAXX shell." height="min-h-screen" />}>
          <MustangScene />
        </Suspense>
        <Suspense
          fallback={<SceneFallback id="departments" eyebrow="Departments" title="Loading the revenue engines." />}
        >
          <OutcomeChaptersScene />
        </Suspense>
        <Suspense fallback={<SceneFallback id="mission" eyebrow="Final protocol" title="Loading the closing act." />}>
          <FinalMissionScene />
        </Suspense>
      </ShellLayout>
      {!introComplete && <IntroSequence onComplete={handleIntroComplete} />}
    </>
  );
};

export default Index;
