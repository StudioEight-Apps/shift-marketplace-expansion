import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Listing } from "@/components/shift/ListingCard";

interface MiniCarCardProps {
  car: Listing;
  isSelected: boolean;
  onToggle: () => void;
}

const MiniCarCard = ({ car, isSelected, onToggle }: MiniCarCardProps) => {
  return (
    <div
      className={cn(
        "group relative flex-shrink-0 w-[160px] overflow-hidden rounded-lg bg-secondary/30 border transition-all duration-200 cursor-pointer",
        isSelected 
          ? "border-primary ring-1 ring-primary/50" 
          : "border-border-subtle hover:border-border"
      )}
      onClick={onToggle}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={car.image}
          alt={car.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-3">
        <h4 className="text-sm font-medium text-foreground truncate">
          {car.title}
        </h4>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm font-semibold text-primary">
            ${car.price}
            <span className="text-xs text-muted-foreground font-normal">/day</span>
          </span>
          
          {!isSelected && (
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiniCarCard;
