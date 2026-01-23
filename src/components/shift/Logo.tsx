import shiftLogo from "@/assets/shift-logo.webp";

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <img src={shiftLogo} alt="Shift Rentals" className="h-10 w-auto" />
    </div>
  );
};

export default Logo;
