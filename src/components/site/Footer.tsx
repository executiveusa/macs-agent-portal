import { Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="border-t border-border bg-[#060708] text-white">
      <div className="container mx-auto px-6 py-12 grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.3em]">MACS Digital Media</h3>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/60">
            We install MAXX — a managed AI operator that recovers missed follow-ups for nonprofits and
            social-purpose teams in Seattle and the Pacific Northwest.
          </p>
          <p className="mt-3 text-[10px] uppercase tracking-[0.36em] text-white/40">
            Powered by Hermes. Managed as MAXX.
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.36em] text-white/40">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href="#outcomes" className="text-white/70 hover:text-maxx-orange">Outcomes</a></li>
            <li><a href="#pricing" className="text-white/70 hover:text-maxx-orange">Pricing</a></li>
            <li><Link to="/blog" className="text-white/70 hover:text-maxx-orange">MAXX Blog</Link></li>
            <li><a href="#audit" className="text-white/70 hover:text-maxx-orange">Book a Recovery Audit</a></li>
          </ul>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.36em] text-white/40">Contact</p>
          <p className="mt-3 text-sm text-white/70">Seattle, WA</p>
          <a
            href="mailto:hello@macsdigitalmedia.com"
            className="mt-2 inline-flex items-center gap-2 text-sm text-white/70 hover:text-maxx-orange"
          >
            <Mail size={16} /> hello@macsdigitalmedia.com
          </a>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 py-5 text-center text-[11px] uppercase tracking-[0.3em] text-white/35">
          © {year} MACS Digital Media · Agent MAXX is a managed operator, not a guaranteed revenue outcome.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
