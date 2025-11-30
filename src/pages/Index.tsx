import { useEffect, useState } from "react";
import LoadingScreen from "@/components/site/LoadingScreen";
import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import About from "@/components/site/About";
import ProblemSection from "@/components/sections/ProblemSection";
import TransformSection from "@/components/sections/TransformSection";
import ServicesSection from "@/components/sections/ServicesSection";
import ProcessSection from "@/components/sections/ProcessSection";
import CtaSection from "@/components/sections/CtaSection";
import ComicTeasers from "@/components/site/ComicTeasers";
import Web3Entry from "@/components/site/Web3Entry";
import Footer from "@/components/site/Footer";

const Index = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <ProblemSection />
        <TransformSection />
        <About />
        <ServicesSection />
        <ProcessSection />
        <CtaSection />
        <ComicTeasers />
        <Web3Entry />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
