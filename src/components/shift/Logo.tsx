import { Link } from "react-router-dom";
import shiftLogo from "@/assets/shift-logo.webp";
import shiftLogoHorizontal from "@/assets/shift-logo-horizontal.png";

const Logo = () => {
  return (
    <Link to="/" className="flex items-center gap-2">
      {/* Mobile logo - larger */}
      <img src={shiftLogo} alt="Shift Rentals" className="h-12 w-auto md:hidden" />
      {/* Desktop horizontal logo - more prominent */}
      <img src={shiftLogoHorizontal} alt="Shift Rentals" className="hidden md:block h-10 w-auto" />
    </Link>
  );
};

export default Logo;
