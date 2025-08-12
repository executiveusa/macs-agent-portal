const About = () => {
  return (
    <section id="about" aria-label="About" className="container mx-auto px-6 py-20">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold">Origin Story</h2>
        <p className="mt-4 text-muted-foreground">
          From backroads to backends—Mustang Max channels classic grit into modern craft.
          MACS DIGITAL MEDIA builds brand experiences that move like machines and feel like films.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            { title: 'Cinematic', text: 'Noir vibes. Neon cues. Sharp hierarchy.' },
            { title: 'Agentic', text: 'Tools that act, so you can steer.' },
            { title: 'Web3 + AI', text: 'Wallet-first onboarding. AI-assisted flows.' },
          ].map((b) => (
            <div key={b.title} className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
