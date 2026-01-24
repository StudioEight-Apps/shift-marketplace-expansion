import shiftLogo from "@/assets/shift-logo.webp";
import shiftLogoHorizontal from "@/assets/shift-logo-horizontal.png";

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      {/* Mobile logo */}
      <img src={shiftLogo} alt="Shift Rentals" className="h-10 w-auto md:hidden" />
      {/* Desktop horizontal logo */}
      <img src={shiftLogoHorizontal} alt="Shift Rentals" className="hidden md:block h-8 w-auto" />
    </div>
  );
};

export default Logo;
