import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import AdminHero from "@/components/dashboard/AdminHero";
import AgentHub from "@/components/dashboard/AgentHub";
import FunctionShowcase from "@/components/dashboard/FunctionShowcase";
import OperationsCenter from "@/components/dashboard/OperationsCenter";
import HelpAndFAQ from "@/components/dashboard/HelpAndFAQ";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <Navbar />
      <main className="container mx-auto space-y-16 pb-20 pt-24">
        <AdminHero />
        <AgentHub />
        <FunctionShowcase />
        <OperationsCenter />
        <HelpAndFAQ />
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
