import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/lib/i18n";

const About = () => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  return (
    <section id="about" aria-label="About Mustang Max" className="container mx-auto px-6 py-20">
      <motion.div
        className="max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
          {t("aboutTitle")}
        </h2>
        <div className="space-y-6 text-lg text-text-secondary leading-relaxed">
          <p>{t("aboutParagraph1")}</p>
          <p>{t("aboutParagraph2")}</p>
          <p>{t("aboutParagraph3")}</p>
        </div>
      </motion.div>
    </section>
  );
};

export default About;
