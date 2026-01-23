import Logo from "./Logo";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="w-48" /> {/* Spacer for balance */}
        
        <Logo />
        
        <div className="w-48 flex justify-end">
          <Button variant="cta" size="sm">
            Build the Full Experience
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
