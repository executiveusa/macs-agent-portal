import logo from "@/assets/logo.png";

const LoadingScreen = () => {
  return (
    <div role="status" aria-label="Loading" className="fixed inset-0 z-50 grid place-items-center bg-background">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "var(--gradient-hero)"
      }} />
      <div className="relative flex flex-col items-center gap-4 animate-fade-in">
        <img src={logo} alt="MACS Digital Media logo" className="w-24 h-24 drop-shadow-[var(--shadow-glow)]" />
        <div className="h-1 w-48 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-1/3 animate-[pulse_1.8s_cubic-bezier(0.4,0,0.6,1)_infinite] rounded-full bg-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Initializing cockpit…</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
