import { cn } from "@/lib/utils";

interface CitySelectorProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
}

const cities = ["NYC", "Miami", "LA"];

const CitySelector = ({ selectedCity, onCityChange }: CitySelectorProps) => {
  return (
    <div className="flex items-center justify-center gap-1">
      {cities.map((city) => (
        <button
          key={city}
          onClick={() => onCityChange(city)}
          className={cn(
            "px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
            selectedCity === city 
              ? "text-primary border border-primary/50 bg-primary/5" 
              : "text-muted-foreground hover:text-foreground border border-transparent"
          )}
        >
          {city}
        </button>
      ))}
    </div>
  );
};

export default CitySelector;
