import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const StripeButton = () => {
  return (
    <Button
      size="lg"
      className="hover-scale"
      onClick={() =>
        toast({ title: "Stripe Payment", description: "Stripe JS checkout scaffolding ready. Add publishable key and endpoint in Patch 002.", })
      }
      aria-label="Pay Now"
    >
      Pay Now
    </Button>
  );
};

export default StripeButton;
