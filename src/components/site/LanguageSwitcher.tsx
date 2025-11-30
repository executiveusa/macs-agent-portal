import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === "en" ? "es-MX" : "en")}
      className="gap-2"
      aria-label={`Switch to ${language === "en" ? "Spanish" : "English"}`}
    >
      <Globe className="h-4 w-4" />
      {language === "en" ? "ES" : "EN"}
    </Button>
  );
};

export default LanguageSwitcher;