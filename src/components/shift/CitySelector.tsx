import { cn } from "@/lib/utils";

interface CitySelectorProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
}

const cities = ["NYC", "Miami", "LA"];

const CitySelector = ({ selectedCity, onCityChange }: CitySelectorProps) => {
  return (
    <div className="flex items-center justify-center gap-2">
      {cities.map((city) => (
        <button
          key={city}
          onClick={() => onCityChange(city)}
          className={cn(
            "pill-base min-w-[100px] text-sm",
            selectedCity === city ? "pill-active" : "pill-inactive"
          )}
        >
          {city}
        </button>
      ))}
    </div>
  );
};

export default CitySelector;
