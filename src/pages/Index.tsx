import { ShellLayout } from "@/components/layout/ShellLayout";
import { HeroScene } from "@/components/scenes/HeroScene";
import { BriefingScene } from "@/components/scenes/BriefingScene";
import { MustangScene } from "@/components/scenes/MustangScene";

const Index = () => {
  return (
    <ShellLayout>
      <HeroScene />
      <BriefingScene />
      <MustangScene />
      {/* Placeholder for Mission/Comic Scene */}
      <div className="h-screen flex items-center justify-center bg-maxx-bg text-gray-600" id="mission">
        <div className="text-center">
           <h3 className="text-2xl font-bold uppercase">Mission Archives</h3>
           <p>Access Granted via Dashboard</p>
        </div>
      </div>
    </ShellLayout>
  );
};

export default Index;
