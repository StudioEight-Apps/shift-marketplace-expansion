import { Link } from "react-router-dom";
import { Instagram, Youtube, Facebook } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border-subtle bg-background py-8">
      <div className="container px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left - Links */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="#" className="hover:text-foreground transition-colors">
            Contact Us
          </Link>
          <Link to="#" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link to="#" className="hover:text-foreground transition-colors">
            Terms & Conditions
          </Link>
        </div>

        {/* Right - Social Icons */}
        <div className="flex items-center gap-4">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Instagram className="h-5 w-5" />
          </a>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Youtube className="h-5 w-5" />
          </a>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Facebook className="h-5 w-5" />
          </a>
        </div>
      </div>

      {/* Copyright */}
      <div className="container px-6 mt-6 pt-6 border-t border-border-subtle">
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} Shift. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
