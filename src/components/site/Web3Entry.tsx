import WalletConnectButton from "./WalletConnectButton";
import StripeButton from "./StripeButton";

const Web3Entry = () => {
  return (
    <section id="web3" aria-label="Web3 entry" className="container mx-auto px-6 py-20">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold">Enter Web3</h2>
        <p className="mt-3 text-muted-foreground">
          Connect your wallet to unlock agent tools. Prefer fiat? Use Stripe.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <WalletConnectButton />
          <StripeButton />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Scaffolded for RainbowKit + wagmi and Stripe Checkout.</p>
      </div>
    </section>
  );
};

export default Web3Entry;
