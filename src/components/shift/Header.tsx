import Logo from "./Logo";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-10 md:h-12 items-center justify-between px-4 md:px-6">
        <Logo />
        
        <nav className="flex items-center gap-2 md:gap-6">
          <a href="#" className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors">
            Concierge
          </a>
          <a href="#" className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors">
            Partner Up
          </a>
          <a href="#" className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors">
            Contact Us
          </a>
          <Button variant="cta" size="sm" className="text-xs md:text-sm px-3 md:px-4">
            Create an account
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
