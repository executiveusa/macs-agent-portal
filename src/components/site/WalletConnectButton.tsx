import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const WalletConnectButton = () => {
  return (
    <Button
      size="lg"
      variant="secondary"
      className="hover-scale"
      onClick={() =>
        toast({ title: "Wallet Connect", description: "RainbowKit + wagmi scaffolding ready. Add WalletConnect Project ID in Patch 002 to enable.", })
      }
      aria-label="Connect Wallet"
    >
      Connect Wallet
    </Button>
  );
};

export default WalletConnectButton;
