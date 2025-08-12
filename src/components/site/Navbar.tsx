const Navbar = () => {
  const links = [
    { href: "#hero", label: "Home" },
    { href: "#about", label: "About" },
    { href: "#comics", label: "Comics" },
    { href: "#web3", label: "Web3" },
    { href: "#dashboard", label: "Agents" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/70 backdrop-blur-md">
      <nav className="container mx-auto flex items-center justify-between py-3">
        <a href="#hero" className="font-semibold tracking-wider">MACS DIGITAL MEDIA</a>
        <ul className="flex gap-3 overflow-x-auto">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="px-3 py-1 rounded-md hover-scale text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
