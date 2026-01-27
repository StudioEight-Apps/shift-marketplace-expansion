import { useState } from "react";
import Logo from "./Logo";
import { User, Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

const Header = () => {
  // Simulating logged out state - this would come from auth context
  const [isLoggedIn] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-10 md:h-12 items-center justify-between px-4 md:px-6">
        <Logo />
        
        <nav className="flex items-center gap-2 md:gap-6">
          {/* Desktop links */}
          <a href="#" className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors">
            Concierge
          </a>
          <a href="#" className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors">
            Contact Us
          </a>
          
          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary hover:bg-primary/80 transition-colors">
                <User className="h-4 w-4 text-primary-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card border-border-subtle">
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
                  {/* Theme toggle */}
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      {theme === "dark" ? (
                        <Moon className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Sun className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">Light Mode</span>
                    </div>
                    <Switch
                      checked={theme === "light"}
                      onCheckedChange={toggleTheme}
                      className="scale-75"
                    />
                  </div>
                  <DropdownMenuSeparator className="bg-border-subtle" />
                  <DropdownMenuItem className="cursor-pointer text-destructive">
                    Log out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem className="cursor-pointer">
                    Concierge
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    Contact Us
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border-subtle" />
                  {/* Theme toggle */}
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      {theme === "dark" ? (
                        <Moon className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Sun className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">Light Mode</span>
                    </div>
                    <Switch
                      checked={theme === "light"}
                      onCheckedChange={toggleTheme}
                      className="scale-75"
                    />
                  </div>
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
