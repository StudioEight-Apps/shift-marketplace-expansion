import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCities } from "@/context/CitiesContext";

// Re-export for backward compatibility
export type { CityDoc as City } from "@/lib/cities";

interface CitySelectorProps {
  selectedCityId: string;
  onCityChange: (cityId: string) => void;
}

const CitySelector = ({ selectedCityId, onCityChange }: CitySelectorProps) => {
  const { cities } = useCities();
  const selectedCity = cities.find(c => c.id === selectedCityId);

  return (
    <Select value={selectedCityId} onValueChange={onCityChange}>
      <SelectTrigger
        className="w-auto min-w-[140px] gap-2 border-border bg-secondary/30 hover:bg-secondary/50 transition-colors rounded-full px-4 py-2 h-9 text-sm font-medium"
      >
        <SelectValue>
          {selectedCity ? `${selectedCity.name}, ${selectedCity.state}` : "Select City"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-card border-border-subtle">
        {cities.map((city) => (
          <SelectItem
            key={city.id}
            value={city.id}
            className="cursor-pointer"
          >
            {city.name}, {city.state}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CitySelector;
