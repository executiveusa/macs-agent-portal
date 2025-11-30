import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/lib/i18n";

const ProcessSection = () => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const steps = [
    { title: t("processStep1Title"), desc: t("processStep1Desc") },
    { title: t("processStep2Title"), desc: t("processStep2Desc") },
    { title: t("processStep3Title"), desc: t("processStep3Desc") },
    { title: t("processStep4Title"), desc: t("processStep4Desc") },
  ];

  return (
    <section className="section-light py-20" id="process">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold">{t("processTitle")}</h2>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className={`relative pl-8 pb-12 border-l-2 ${
                idx === steps.length - 1 ? "border-transparent" : "border-primary/30"
              }`}
            >
              <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-background" />
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-text-secondary">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;