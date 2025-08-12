import { Mail, Twitter, Github } from "lucide-react";

const Footer = () => {
  return (
    <footer id="contact" className="border-t border-border">
      <div className="container mx-auto px-6 py-10 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="font-semibold">Contact</h3>
          <p className="mt-2 text-sm text-muted-foreground">hello@macsdigitalmedia.io</p>
          <div className="mt-4 flex gap-3 text-muted-foreground">
            <a href="mailto:hello@macsdigitalmedia.io" aria-label="Email" className="hover-scale">
              <Mail size={20} />
            </a>
            <a href="#" aria-label="Twitter" className="hover-scale">
              <Twitter size={20} />
            </a>
            <a href="#" aria-label="GitHub" className="hover-scale">
              <Github size={20} />
            </a>
          </div>
        </div>
        <div className="md:text-right text-sm text-muted-foreground self-end">
          Designed by MACS DIGITAL MEDIA 2025
        </div>
      </div>
    </footer>
  );
};

export default Footer;
