import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { User } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import AuthModal from "./AuthModal";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"login" | "signup">("login");

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const openLogin = () => {
    setAuthDefaultTab("login");
    setShowAuthModal(true);
  };

  const openSignup = () => {
    setAuthDefaultTab("signup");
    setShowAuthModal(true);
  };

  return (
    <>
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
              Contact Us
            </Link>
            
            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-black dark:bg-primary hover:bg-black/80 dark:hover:bg-primary/80 transition-colors">
                  <User className="h-4 w-4 text-white dark:text-primary-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-card border-border-subtle">
                {!loading && user ? (
                  <>
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => navigate("/trips")}
                    >
                      My Trips
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => navigate("/profile")}
                    >
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border-subtle" />
                    {/* Theme toggle - 3 state */}
                    <ThemeToggle />
                    <DropdownMenuSeparator className="bg-border-subtle" />
                    <DropdownMenuItem 
                      className="cursor-pointer text-destructive"
                      onClick={handleLogout}
                    >
                      Log Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={openLogin}
                    >
                      Log In
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={openSignup}
                    >
                      Sign Up
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border-subtle" />
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

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab={authDefaultTab}
      />
    </>
  );
};

export default Header;
