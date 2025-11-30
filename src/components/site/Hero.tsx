import hero from "@/assets/hero-bg.jpg";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/lib/i18n";
import { MapPin } from "lucide-react";

const Hero = () => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  return (
    <section id="hero" aria-label="Hero" className="relative min-h-screen grid place-items-center overflow-hidden">
      {/* Background with parallax */}
      <motion.div
        className="absolute inset-0 -z-10"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${hero})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />
      </motion.div>

      {/* Content */}
      <div className="container mx-auto px-6 py-24 text-center relative z-10">
        <motion.div
          className="flex items-center justify-center gap-2 mb-4 text-sm text-primary"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <MapPin className="h-4 w-4" />
          <span>{t("heroLocation")}</span>
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {t("heroTitle")}
        </motion.h1>

        <motion.p
          className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {t("heroSubtitle")}
        </motion.p>

        <motion.p
          className="mt-4 text-base md:text-lg text-foreground/80 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {t("heroDescription")}
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <Button
            size="lg"
            className="hover-scale shadow-glow"
            onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
            aria-label={t("heroCta")}
          >
            {t("heroCta")}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="hover-scale"
            onClick={() => window.location.href = "/blog"}
            aria-label={t("heroCtaSecondary")}
          >
            {t("heroCtaSecondary")}
          </Button>
        </motion.div>

        <motion.p
          className="mt-8 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          {t("heroTrust")}
        </motion.p>
      </div>
    </section>
  );
};

export default Hero;
