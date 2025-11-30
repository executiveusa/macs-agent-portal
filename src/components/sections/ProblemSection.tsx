import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/lib/i18n";
import { AlertCircle, Zap, Clock, TrendingUp } from "lucide-react";

const ProblemSection = () => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const problems = [
    { icon: AlertCircle, text: t("problemPoint1") },
    { icon: Zap, text: t("problemPoint2") },
    { icon: Clock, text: t("problemPoint3") },
    { icon: TrendingUp, text: t("problemPoint4") },
  ];

  return (
    <section className="section-cream py-20" id="problem">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("problemTitle")}</h2>
          
          <div className="grid gap-6 md:grid-cols-2 mt-12">
            {problems.map((problem, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="card-warm p-6 text-left"
              >
                <problem.icon className="h-8 w-8 text-primary mb-4" />
                <p className="text-text-secondary">{problem.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 p-6 bg-primary/10 rounded-xl border-2 border-primary/30"
          >
            <p className="text-xl font-medium text-primary">{t("problemTransition")}</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection;