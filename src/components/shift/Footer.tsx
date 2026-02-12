import { Link } from "react-router-dom";
import { Instagram, Youtube, Facebook } from "lucide-react";
import { useContact } from "@/context/ContactContext";

const Footer = () => {
  const { openContact } = useContact();

  return (
    <footer className="border-t border-border-subtle bg-background py-8">
      <div className="container px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left - Links */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <button onClick={openContact} className="hover:text-foreground transition-colors">
            Contact Us
          </button>
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Terms & Conditions
          </Link>
        </div>

        {/* Right - Social Icons */}
        <div className="flex items-center gap-4">
          <a
            href="https://www.instagram.com/shiftrentals"
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
            href="https://www.facebook.com/ShiftRentals/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Facebook className="h-5 w-5" />
          </a>
        </div>
      </div>

      {/* Copyright & Brand */}
      <div className="container px-6 mt-6 pt-6 border-t border-border-subtle flex flex-col items-center gap-2">
        <p className="text-xs text-muted-foreground text-center">
          © 2021 Shift Rentals. All rights reserved.
        </p>
        <p className="text-[11px] text-muted-foreground/50 tracking-widest uppercase">
          A <span className="text-muted-foreground/70 font-medium">Traventury</span> Company
        </p>
      </div>
    </footer>
  );
};

export default Footer;
