import { SlidersHorizontal, DollarSign, Users, BedDouble } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const FilterButton = ({ icon, label, active, onClick }: FilterButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
        active 
          ? "bg-secondary text-foreground" 
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

const QuickFilters = () => {
  return (
    <div className="flex items-center justify-center gap-1">
      <FilterButton 
        icon={<SlidersHorizontal className="h-4 w-4" />} 
        label="Filters" 
      />
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
    </div>
  );
};

export default QuickFilters;
