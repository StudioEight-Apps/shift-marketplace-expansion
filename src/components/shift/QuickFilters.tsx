import { SlidersHorizontal, DollarSign, Users, BedDouble, Car, Ruler, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

type AssetType = "Villas" | "Cars" | "Yachts";

interface FilterButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

interface QuickFiltersProps {
  assetType: AssetType;
}

const FilterButton = ({ icon, label, active, onClick }: FilterButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 md:gap-2 rounded-lg px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-all duration-200",
        active 
          ? "bg-secondary text-foreground" 
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      )}
    >
      <span className="[&>svg]:h-3 [&>svg]:w-3 md:[&>svg]:h-4 md:[&>svg]:w-4">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

const QuickFilters = ({ assetType }: QuickFiltersProps) => {
  const getFiltersForType = () => {
    switch (assetType) {
      case "Cars":
        return (
          <>
            <FilterButton 
              icon={<DollarSign className="h-4 w-4" />} 
              label="Price" 
            />
            <FilterButton 
              icon={<Car className="h-4 w-4" />} 
              label="Brand" 
            />
            <FilterButton 
              icon={<Users className="h-4 w-4" />} 
              label="Seats" 
            />
            <FilterButton 
              icon={<Gauge className="h-4 w-4" />} 
              label="Body Style" 
            />
          </>
        );
      case "Yachts":
        return (
          <>
            <FilterButton 
              icon={<DollarSign className="h-4 w-4" />} 
              label="Price" 
            />
            <FilterButton 
              icon={<Users className="h-4 w-4" />} 
              label="Guests" 
            />
            <FilterButton 
              icon={<Ruler className="h-4 w-4" />} 
              label="Length" 
            />
          </>
        );
      default: // Villas
        return (
          <>
            <FilterButton 
              icon={<DollarSign className="h-4 w-4" />} 
              label="Price" 
            />
            <FilterButton 
              icon={<Users className="h-4 w-4" />} 
              label="Guests" 
            />
            <FilterButton 
              icon={<BedDouble className="h-4 w-4" />} 
              label="Beds" 
            />
          </>
        );
    }
  };

  return (
    <div className="flex items-center justify-center gap-1 transition-all duration-300">
      <FilterButton 
        icon={<SlidersHorizontal className="h-4 w-4" />} 
        label="Filters" 
      />
      {getFiltersForType()}
    </div>
  );
};

export default QuickFilters;
