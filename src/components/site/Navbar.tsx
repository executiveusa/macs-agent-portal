import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";

const homeLinks = [
  { href: "#hero", labelKey: "navHome" as const },
  { href: "#about", labelKey: "navAbout" as const },
  { href: "#services", labelKey: "navServices" as const },
  { href: "/blog", labelKey: "navBlog" as const },
  { href: "#contact", labelKey: "navContact" as const },
];

const dashboardLinks = [
  { href: "#hero", label: "Overview" },
  { href: "#agent-builder", label: "Agent Builder" },
  { href: "#mustang-marketplace", label: "Marketplace" },
  { href: "#insights", label: "Insights" },
  { href: "#pricing", label: "Membership" },
  { href: "/shop", label: "Shop" },
  { href: "/admin", label: "Admin" },
];

const shopLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/admin", label: "Admin" },
];

const adminLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/shop", label: "Shop" },
  { href: "#agent-hub", label: "Agents" },
  { href: "#functions", label: "Functions" },
  { href: "#operations", label: "Operations" },
  { href: "#help", label: "Help" },
];

const Navbar = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const links = location.pathname === "/dashboard" 
    ? dashboardLinks 
    : location.pathname === "/shop"
    ? shopLinks
    : location.pathname === "/admin"
    ? adminLinks
    : homeLinks;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/70 backdrop-blur-md">
      <nav className="container mx-auto flex items-center justify-between py-3 px-4">
        <Link to="/" className="font-semibold tracking-wider">
          MACS DIGITAL MEDIA
        </Link>
        <ul className="flex items-center gap-3 overflow-x-auto">
          {links.map((l) => {
            const label = "labelKey" in l ? t(l.labelKey) : l.label;
            return (
              <li key={l.href}>
                {l.href.startsWith("#") ? (
                  <a
                    href={l.href}
                    className="hover-scale rounded-md px-3 py-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {label}
                  </a>
                ) : (
                  <Link
                    to={l.href}
                    className="hover-scale rounded-md px-3 py-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button asChild size="sm" variant="outline" className="hidden text-xs font-semibold sm:inline-flex">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
