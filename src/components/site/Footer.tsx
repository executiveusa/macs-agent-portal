import { Mail, Twitter, Github } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/lib/i18n";

const Footer = () => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  return (
    <footer id="contact" className="border-t border-border">
      <div className="container mx-auto px-6 py-10 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="font-semibold mb-3">Contact</h3>
          <p className="text-sm text-muted-foreground mb-2">hello@macsdigitalmedia.io</p>
          <p className="text-sm text-muted-foreground mb-4">{t("heroLocation")}</p>
          <div className="flex gap-3 text-muted-foreground">
            <a href="mailto:hello@macsdigitalmedia.io" aria-label="Email" className="hover-scale hover:text-primary transition-colors">
              <Mail size={20} />
            </a>
            <a href="#" aria-label="Twitter" className="hover-scale hover:text-primary transition-colors">
              <Twitter size={20} />
            </a>
            <a href="#" aria-label="GitHub" className="hover-scale hover:text-primary transition-colors">
              <Github size={20} />
            </a>
          </div>
        </div>
        <div className="md:text-right space-y-2">
          <p className="text-sm text-muted-foreground">{t("footerTagline")}</p>
          <p className="text-sm text-muted-foreground">{t("footerCopyright")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
