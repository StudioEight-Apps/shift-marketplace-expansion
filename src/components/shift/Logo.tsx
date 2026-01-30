import { useNavigate } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { useSearch } from "@/context/SearchContext";
import shiftLogoDark from "@/assets/shift-logo.webp";
import shiftLogoLight from "@/assets/shift-logo-black.png";
import shiftLogoHorizontal from "@/assets/shift-logo-horizontal.png";

const Logo = () => {
  const { resolvedTheme } = useTheme();
  const { setCityId, setSearchDates } = useSearch();
  const navigate = useNavigate();
  
  // Use black logo for light mode, original for dark mode on mobile
  const mobileLogo = resolvedTheme === "light" ? shiftLogoLight : shiftLogoDark;

  const handleLogoClick = () => {
    // Reset search state to fresh
    setCityId("");
    setSearchDates(null, null);
    // Navigate to home with no params
    navigate("/", { replace: true });
  };
  
  return (
    <button onClick={handleLogoClick} className="flex items-center gap-2">
      {/* Mobile logo - theme aware */}
      <img src={mobileLogo} alt="Shift Rentals" className="h-12 w-auto md:hidden" />
      {/* Desktop horizontal logo - blue works for both themes */}
      <img src={shiftLogoHorizontal} alt="Shift Rentals" className="hidden md:block h-10 w-auto" />
    </button>
  );
};

export default Logo;
