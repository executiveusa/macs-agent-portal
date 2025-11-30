import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/lib/i18n";
import { Check } from "lucide-react";

const TransformSection = () => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const transformations = [
    t("transformPoint1"),
    t("transformPoint2"),
    t("transformPoint3"),
    t("transformPoint4"),
  ];

  return (
    <section className="section-light py-20" id="transformation">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-12">{t("transformTitle")}</h2>
          
          <div className="space-y-4">
            {transformations.map((text, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex items-start gap-4 text-left p-4 rounded-lg hover:bg-background-secondary transition-colors"
              >
                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <p className="text-lg text-text-primary flex-1">{text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TransformSection;