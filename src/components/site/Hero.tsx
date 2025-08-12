import hero from "@/assets/hero-bg.jpg";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section id="hero" aria-label="Hero" className="relative min-h-[90vh] grid place-items-center">
      <div className="absolute inset-0 -z-10" style={{
        backgroundImage: `url(${hero})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }} />
      <div className="absolute inset-0 -z-10" style={{ background: 'var(--gradient-hero)' }} />

      <div className="container mx-auto px-6 py-24 text-center animate-enter">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Mustang Max: Legacy Reborn
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          A cinematic Web3 + AI cockpit engineered for speed, clarity, and control.
        </p>
        <div className="mt-8 flex justify-center">
          <a href="#about">
            <Button size="lg" className="hover-scale" variant="default" aria-label="Enter">
              Enter
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
