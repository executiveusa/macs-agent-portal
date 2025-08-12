import comic from "@/assets/comic-sample.jpg";

const ComicTeasers = () => {
  const items = Array.from({ length: 6 }, (_, i) => i);
  return (
    <section id="comics" aria-label="Comic teasers" className="py-20">
      <div className="container mx-auto px-6">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-2xl md:text-3xl font-bold">Comic Teasers</h2>
          <a href="#comics" className="story-link text-sm">See more</a>
        </div>
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
          {items.map((i) => (
            <article key={i} className="min-w-[75%] sm:min-w-[45%] md:min-w-[32%] lg:min-w-[28%] snap-start">
              <div className="rounded-lg overflow-hidden border bg-card">
                <img src={comic} alt={`Comic teaser frame ${i + 1}`} loading="lazy" className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="font-medium">Episode {i + 1}</h3>
                  <p className="text-sm text-muted-foreground">A glimpse of motion and myth.</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ComicTeasers;
