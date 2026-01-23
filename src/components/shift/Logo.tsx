import { Waves } from "lucide-react";

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Waves className="h-8 w-8 text-primary" strokeWidth={2.5} />
      </div>
      <span className="text-xl font-semibold tracking-tight text-foreground">
        Shift<span className="text-primary">Rentals</span>
      </span>
    </div>
  );
};

export default Logo;
