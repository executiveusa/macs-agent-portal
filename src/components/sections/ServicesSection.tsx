import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/lib/i18n";
import { Bot, Sparkles, GraduationCap, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const ServicesSection = () => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const services = [
    {
      icon: Bot,
      title: t("service1Title"),
      hook: t("service1Hook"),
      desc: t("service1Desc"),
      outcome: t("service1Outcome"),
    },
    {
      icon: Sparkles,
      title: t("service2Title"),
      hook: t("service2Hook"),
      desc: t("service2Desc"),
      outcome: t("service2Outcome"),
    },
    {
      icon: GraduationCap,
      title: t("service3Title"),
      hook: t("service3Hook"),
      desc: t("service3Desc"),
      outcome: t("service3Outcome"),
    },
    {
      icon: Wallet,
      title: t("service4Title"),
      hook: t("service4Hook"),
      desc: t("service4Desc"),
      outcome: t("service4Outcome"),
    },
  ];

  return (
    <section className="section-cream py-20" id="services">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold">{t("servicesTitle")}</h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2">
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="card-warm p-8 hover-lift"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">{service.title}</h3>
                  <p className="text-sm font-medium text-primary">{service.hook}</p>
                </div>
              </div>
              <p className="text-text-secondary mb-4">{service.desc}</p>
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium text-text-primary">
                  <span className="text-accent">Outcome:</span> {service.outcome}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12"
        >
          <Button size="lg" className="btn-primary">
            {t("ctaButton")}
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;