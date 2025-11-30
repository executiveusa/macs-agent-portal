import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const CtaSection = () => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  return (
    <section className="section-accent py-20">
      <motion.div
        className="container-max text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("ctaTitle")}</h2>
        <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">{t("ctaSubtitle")}</p>
        <Button size="lg" variant="secondary" className="hover-scale">
          {t("ctaButton")}
        </Button>
        <p className="mt-4 text-sm opacity-75">{t("ctaReassurance")}</p>
      </motion.div>
    </section>
  );
};

export default CtaSection;