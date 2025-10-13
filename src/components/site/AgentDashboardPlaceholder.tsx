import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const AgentDashboardPlaceholder = () => {
  return (
    <section id="dashboard" aria-label="Agent dashboard" className="container mx-auto px-6 py-20">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Agent Console</h3>
          <p className="mt-2 text-sm text-muted-foreground">Private route. Connect to proceed.</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Insights</h3>
          <p className="mt-2 text-sm text-muted-foreground">AI-assisted summaries arrive here.</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Missions</h3>
          <p className="mt-2 text-sm text-muted-foreground">Track progress and outcomes.</p>
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center gap-4 text-center">
        <Button
          onClick={() =>
            toast({
              title: "Request Access",
              description: "Agent tools unlock post wallet connect.",
            })
          }
        >
          Request Access
        </Button>
        <Link
          to="/dashboard"
          className="text-sm font-semibold text-primary underline-offset-4 transition hover:underline"
        >
          Tour the Mustang Max agent studio →
        </Link>
      </div>
    </section>
  );
};

export default AgentDashboardPlaceholder;
