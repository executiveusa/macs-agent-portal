import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { maxxBlogPosts, blogCategoryColors, formatBlogCategory } from "@/content/maxxBlogPosts";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  category: string;
  tags: string[];
  published_at: string;
  read_minutes?: number;
}

const Blog = () => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("published_at", { ascending: false });

      if (error) throw error;
      // Merge live posts with seed fallback so the blog is never empty.
      const live = (data || []) as BlogPost[];
      const liveSlugs = new Set(live.map((p) => p.slug));
      const seeds = maxxBlogPosts
        .filter((p) => !liveSlugs.has(p.slug))
        .map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          featured_image: null,
          category: p.category,
          tags: p.tags,
          published_at: p.published_at,
          read_minutes: p.read_minutes,
        }));
      setPosts([...live, ...seeds]);
    } catch (error) {
      // Supabase unavailable: fall back to seeds so the page is useful.
      console.error("Error fetching posts:", error);
      setPosts(maxxBlogPosts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        featured_image: null,
        category: p.category,
        tags: p.tags,
        published_at: p.published_at,
        read_minutes: p.read_minutes,
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchPosts();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchPosts]);

  const getCategoryColor = (category: string) => {
    return blogCategoryColors[category] || "bg-white/15 text-white/80 border-white/25";
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="section-accent py-16">
          <div className="container-max text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[10px] uppercase tracking-[0.5em] text-maxx-orange/80 mb-4">Agent MAXX // Field Notes</p>
              <h1 className="text-4xl md:text-5xl font-black uppercase mb-4">
                MAXX BLOG
              </h1>
              <p className="text-lg opacity-90 max-w-2xl mx-auto">
                Follow-up, donor recovery, and owned AI operations for nonprofits and social-purpose teams in Seattle and the Pacific Northwest.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="section-light py-20">
          <div className="container-max">
            <h2 className="text-2xl font-bold mb-8">{t("blogLatest")}</h2>

            {loading ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-48 bg-muted rounded-lg mb-4" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </Card>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">{t("blogNoArticles")}</p>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post, idx) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <Card className="overflow-hidden hover-lift h-full flex flex-col">
                      {post.featured_image && (
                        <div className="aspect-video w-full overflow-hidden bg-muted">
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={getCategoryColor(post.category)}>
                            {formatBlogCategory(post.category)}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(post.published_at), "MMM d, yyyy")}
                          </span>
                          {post.read_minutes && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.read_minutes} min
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-semibold mb-2 line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-text-secondary text-sm mb-4 line-clamp-3 flex-1">
                          {post.excerpt}
                        </p>

                        <Button
                          variant="ghost"
                          className="group w-full justify-between"
                        >
                          {t("blogReadMore")}
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
