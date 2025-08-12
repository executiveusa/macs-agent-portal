import { useEffect, useState } from "react";
import LoadingScreen from "@/components/site/LoadingScreen";
import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import About from "@/components/site/About";
import ComicTeasers from "@/components/site/ComicTeasers";
import Web3Entry from "@/components/site/Web3Entry";
import AgentDashboardPlaceholder from "@/components/site/AgentDashboardPlaceholder";
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
        <About />
        <ComicTeasers />
        <Web3Entry />
        <AgentDashboardPlaceholder />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
