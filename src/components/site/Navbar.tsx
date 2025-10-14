import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const homeLinks = [
  { href: "#hero", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#comics", label: "Comics" },
  { href: "#web3", label: "Web3" },
  { href: "#dashboard", label: "Agents" },
  { href: "#contact", label: "Contact" },
  { href: "/signin", label: "Sign in" },
];

const dashboardLinks = [
  { href: "#hero", label: "Overview" },
  { href: "#agent-hub", label: "Agents" },
  { href: "#functions", label: "Functions" },
  { href: "#operations", label: "Operations" },
  { href: "#help", label: "Help" },
];

const Navbar = () => {
  const location = useLocation();
  const links = location.pathname === "/dashboard" ? dashboardLinks : homeLinks;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/70 backdrop-blur-md">
      <nav className="container mx-auto flex items-center justify-between py-3">
        <Link to="/" className="font-semibold tracking-wider">
          MACS DIGITAL MEDIA
        </Link>
        <ul className="flex items-center gap-3 overflow-x-auto">
          {links.map((l) => (
            <li key={l.href}>
              {l.href.startsWith("#") ? (
                <a
                  href={l.href}
                  className="hover-scale rounded-md px-3 py-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  to={l.href}
                  className="hover-scale rounded-md px-3 py-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {l.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
        <Button asChild size="sm" variant="outline" className="hidden text-xs font-semibold sm:inline-flex">
          <Link to="/signin">Sign in</Link>
        </Button>
      </nav>
    </header>
  );
};

export default Navbar;
