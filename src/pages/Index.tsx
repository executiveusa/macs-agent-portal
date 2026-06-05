import { useState } from "react";
import { ShellLayout } from "@/components/layout/ShellLayout";
import { IntroSequence } from "@/components/site/IntroSequence";
import { HeroScene } from "@/components/scenes/HeroScene";
import { BriefingScene } from "@/components/scenes/BriefingScene";
import { CarIntroScene } from "@/components/scenes/CarIntroScene";
import { MustangScene } from "@/components/scenes/MustangScene";

const Index = () => {
  const [introComplete, setIntroComplete] = useState(false);

  return (
    <>
      {!introComplete && <IntroSequence onComplete={() => setIntroComplete(true)} />}
      <ShellLayout introComplete={introComplete}>
        <HeroScene />
        <BriefingScene />
        <CarIntroScene />
        <MustangScene />
        <div className="h-screen flex items-center justify-center bg-maxx-bg text-gray-600" id="mission">
          <div className="text-center">
            <h3 className="text-2xl font-bold uppercase">Mission Archives</h3>
            <p>Access Granted via Dashboard</p>
          </div>
        </div>
      </ShellLayout>
    </>
  );
};

export default Index;
