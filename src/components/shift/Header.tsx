import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { User } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  // Simulating logged out state - this would come from auth context
  const [isLoggedIn] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
        {/* Logo - Left aligned, more prominent */}
        <Logo />
        
        {/* Right navigation */}
        <nav className="flex items-center gap-4 md:gap-6">
          {/* Desktop links */}
          <Link 
            to="#" 
            className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Concierge
          </Link>
          <Link 
            to="#" 
            className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact Us
          </Link>
          
          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary hover:bg-primary/80 transition-colors">
                <User className="h-4 w-4 text-primary-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-card border-border-subtle">
              {isLoggedIn ? (
                <>
                  <DropdownMenuItem className="cursor-pointer">
                    Trips
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    Messages
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border-subtle" />
                  <DropdownMenuItem className="cursor-pointer">
                    Concierge
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    Contact Us
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border-subtle" />
                  {/* Theme toggle - 3 state */}
                  <ThemeToggle />
                  <DropdownMenuSeparator className="bg-border-subtle" />
                  <DropdownMenuItem className="cursor-pointer text-destructive">
                    Log out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem className="cursor-pointer md:hidden">
                    Concierge
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer md:hidden">
                    Contact Us
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border-subtle md:hidden" />
                  {/* Theme toggle - 3 state */}
                  <ThemeToggle />
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
};

export default Header;
