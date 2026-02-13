import { ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface City {
  id: string;
  name: string;
  state: string;
  hasYachts: boolean;
}

export const cities: City[] = [
  { id: "aspen", name: "Aspen", state: "CO", hasYachts: false },
  { id: "chicago", name: "Chicago", state: "IL", hasYachts: false },
  { id: "hamptons", name: "The Hamptons", state: "NY", hasYachts: true },
  { id: "las-vegas", name: "Las Vegas", state: "NV", hasYachts: false },
  { id: "los-angeles", name: "Los Angeles", state: "CA", hasYachts: true },
  { id: "miami", name: "Miami", state: "FL", hasYachts: true },
  { id: "nashville", name: "Nashville", state: "TN", hasYachts: false },
  { id: "new-york", name: "New York City", state: "NY", hasYachts: true },
];

interface CitySelectorProps {
  selectedCityId: string;
  onCityChange: (cityId: string) => void;
}

const CitySelector = ({ selectedCityId, onCityChange }: CitySelectorProps) => {
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
