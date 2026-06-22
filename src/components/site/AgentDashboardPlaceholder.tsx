import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const AgentDashboardPlaceholder = () => {
  return (
    <section id="dashboard" aria-label="Agent dashboard" className="container mx-auto px-6 py-20">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Stacy control room</h3>
          <p className="mt-2 text-sm text-muted-foreground">Leads, content, follow-up, and approvals flow into one MAXX workspace.</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Agent analytics</h3>
          <p className="mt-2 text-sm text-muted-foreground">Monitor latency, adoption, and handoff metrics in real-time.</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Guided launches</h3>
          <p className="mt-2 text-sm text-muted-foreground">Follow help center playbooks to deploy with confidence.</p>
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center gap-4 text-center">
        <Button
          onClick={() =>
            toast({
              title: "Access requested",
              description: "We'll notify you once your MAXX operator access is ready.",
            })
          }
        >
          Request operator access
        </Button>
        <Link to="/dashboard" className="text-sm font-semibold text-primary underline-offset-4 transition hover:underline">
          Explore Stacy's dashboard
        </Link>
      </div>
    </section>
  );
};

export default AgentDashboardPlaceholder;
