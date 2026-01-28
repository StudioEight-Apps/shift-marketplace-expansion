import { Link } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import shiftLogoDark from "@/assets/shift-logo.webp";
import shiftLogoLight from "@/assets/shift-logo-black.png";
import shiftLogoHorizontal from "@/assets/shift-logo-horizontal.png";

const Logo = () => {
  const { resolvedTheme } = useTheme();
  
  // Use black logo for light mode, original for dark mode on mobile
  const mobileLogo = resolvedTheme === "light" ? shiftLogoLight : shiftLogoDark;
  
  return (
    <Link to="/" className="flex items-center gap-2">
      {/* Mobile logo - theme aware */}
      <img src={mobileLogo} alt="Shift Rentals" className="h-12 w-auto md:hidden" />
      {/* Desktop horizontal logo - blue works for both themes */}
      <img src={shiftLogoHorizontal} alt="Shift Rentals" className="hidden md:block h-10 w-auto" />
    </Link>
  );
};

export default Logo;
