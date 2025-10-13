import { Link, useLocation } from "react-router-dom";

const homeLinks = [
  { href: "#hero", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#comics", label: "Comics" },
  { href: "#web3", label: "Web3" },
  { href: "#dashboard", label: "Agents" },
  { href: "/shop", label: "Shop" },
  { href: "/admin", label: "Admin" },
  { href: "#contact", label: "Contact" },
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
];

const Navbar = () => {
  const location = useLocation();
  const links = location.pathname === "/dashboard" 
    ? dashboardLinks 
    : location.pathname === "/shop"
    ? shopLinks
    : location.pathname === "/admin"
    ? adminLinks
    : homeLinks;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/70 backdrop-blur-md">
      <nav className="container mx-auto flex items-center justify-between py-3">
        <Link to="/" className="font-semibold tracking-wider">
          MACS DIGITAL MEDIA
        </Link>
        <ul className="flex gap-3 overflow-x-auto">
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
      </nav>
    </header>
  );
};

export default Navbar;
