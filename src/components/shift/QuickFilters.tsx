import { useState } from "react";
import { DollarSign, Users, BedDouble, Car, Ruler, Gauge, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type AssetType = "Stays" | "Cars" | "Yachts";

interface FilterState {
  price: [number, number] | null;
  guests: number | null;
  beds: number | null;
  brand: string[];
  bodyStyle: string[];
  seats: number | null;
  length: [number, number] | null;
}

interface QuickFiltersProps {
  assetType: AssetType;
  filters?: FilterState;
  onFiltersChange?: (filters: FilterState) => void;
}

const defaultFilters: FilterState = {
  price: null,
  guests: null,
  beds: null,
  brand: [],
  bodyStyle: [],
  seats: null,
  length: null,
};

const carBrands = ["Ferrari", "Lamborghini", "Porsche", "Mercedes", "BMW", "Bentley", "Rolls-Royce", "McLaren", "Aston Martin", "Range Rover"];
const bodyStyles = ["Convertible", "Coupe", "SUV", "Sedan", "Sports Car"];

// Label Generator Functions
const formatPrice = (value: number): string => {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }
  return `$${value}`;
};

const getPriceLabel = (
  price: [number, number] | null,
  maxCeiling: number,
  assetType: AssetType
): string | undefined => {
  if (!price) return undefined;
  const [min, max] = price;
  const suffix = assetType === "Yachts" ? "/hr" : "/day";
  
  if (min === 0 && max < maxCeiling) {
    return `Under ${formatPrice(max)}${suffix}`;
  }
  if (min > 0 && max >= maxCeiling) {
    return `${formatPrice(min)}+${suffix}`;
  }
  if (min === 0 && max >= maxCeiling) {
    return undefined; // Full range = no filter
  }
  return `${formatPrice(min)}-${formatPrice(max)}`;
};

const getMultiSelectLabel = (
  selected: string[],
  singular: string,
  plural: string
): string | undefined => {
  if (selected.length === 0) return undefined;
  if (selected.length === 1) return selected[0];
  return `${selected.length} ${plural}`;
};

const getLengthLabel = (length: [number, number] | null): string | undefined => {
  if (!length) return undefined;
  const [min, max] = length;
  
  if (min === 30 && max >= 150) {
    return undefined; // Full range = no filter
  }
  if (min === 30 && max < 150) {
    return `Under ${max} ft`;
  }
  if (min > 30 && max >= 150) {
    return `${min}+ ft`;
  }
  return `${min}-${max} ft`;
};

// Counter Component
const Counter = ({ 
  value, 
  onChange, 
  min = 1, 
  max = 10,
  label 
}: { 
  value: number | null; 
  onChange: (val: number | null) => void; 
  min?: number; 
  max?: number;
  label: string;
}) => {
  const currentValue = value ?? min;
  
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(currentValue <= min ? null : currentValue - 1)}
          className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          disabled={value === null}
        >
          -
        </button>
        <span className="w-8 text-center text-sm font-medium text-foreground">
          {value ?? "Any"}
        </span>
        <button
          onClick={() => onChange(Math.min(currentValue + 1, max))}
          className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
};

// Price Range Slider Component
const PriceRangeSlider = ({ 
  value, 
  onChange,
  min = 0,
  max = 5000,
  step = 100,
  prefix = "$"
}: { 
  value: [number, number] | null; 
  onChange: (val: [number, number] | null) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
}) => {
  const currentValue = value ?? [min, max];
  
  return (
    <div className="py-2 space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Min</span>
        <span className="font-medium text-foreground">{prefix}{currentValue[0].toLocaleString()}</span>
      </div>
      <Slider
        value={currentValue}
        onValueChange={(val) => onChange(val as [number, number])}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Max</span>
        <span className="font-medium text-foreground">{prefix}{currentValue[1].toLocaleString()}{currentValue[1] === max ? "+" : ""}</span>
      </div>
    </div>
  );
};

// Length Range Slider Component
const LengthRangeSlider = ({ 
  value, 
  onChange 
}: { 
  value: [number, number] | null; 
  onChange: (val: [number, number] | null) => void;
}) => {
  const currentValue = value ?? [30, 150];
  
  return (
    <div className="py-2 space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Min</span>
        <span className="font-medium text-foreground">{currentValue[0]} ft</span>
      </div>
      <Slider
        value={currentValue}
        onValueChange={(val) => onChange(val as [number, number])}
        min={30}
        max={150}
        step={5}
        className="w-full"
      />
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Max</span>
        <span className="font-medium text-foreground">{currentValue[1]} ft{currentValue[1] === 150 ? "+" : ""}</span>
      </div>
    </div>
  );
};

// Multi-select Brand Grid
const BrandGrid = ({ 
  selected, 
  onChange 
}: { 
  selected: string[]; 
  onChange: (brands: string[]) => void;
}) => {
  const toggleBrand = (brand: string) => {
    if (selected.includes(brand)) {
      onChange(selected.filter(b => b !== brand));
    } else {
      onChange([...selected, brand]);
    }
  };
  
  return (
    <div className="grid grid-cols-2 gap-2 py-2">
      {carBrands.map(brand => (
        <label
          key={brand}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm",
            selected.includes(brand) 
              ? "bg-secondary text-foreground font-medium" 
              : "hover:bg-secondary/50 text-muted-foreground"
          )}
        >
          <Checkbox 
            checked={selected.includes(brand)}
            onCheckedChange={() => toggleBrand(brand)}
            className="h-4 w-4"
          />
          {brand}
        </label>
      ))}
    </div>
  );
};

// Body Style List
const BodyStyleList = ({ 
  selected, 
  onChange 
}: { 
  selected: string[]; 
  onChange: (styles: string[]) => void;
}) => {
  const toggleStyle = (style: string) => {
    if (selected.includes(style)) {
      onChange(selected.filter(s => s !== style));
    } else {
      onChange([...selected, style]);
    }
  };
  
  return (
    <div className="space-y-1 py-2">
      {bodyStyles.map(style => (
        <label
          key={style}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
            selected.includes(style) 
              ? "bg-secondary text-foreground font-medium" 
              : "hover:bg-secondary/50 text-muted-foreground"
          )}
        >
          <Checkbox 
            checked={selected.includes(style)}
            onCheckedChange={() => toggleStyle(style)}
            className="h-4 w-4"
          />
          <span className="text-sm">{style}</span>
        </label>
      ))}
    </div>
  );
};

// Filter Pill Component
const FilterPill = ({ 
  icon, 
  label, 
  activeLabel,
  isActive,
  children 
}: { 
  icon: React.ReactNode; 
  label: string; 
  activeLabel?: string;
  isActive: boolean;
  children: React.ReactNode;
}) => {
  const displayLabel = isActive && activeLabel ? activeLabel : label;
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1 md:gap-2 rounded-lg px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm transition-all duration-200",
            isActive 
              ? "bg-secondary/80 text-foreground font-semibold" 
              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground font-medium"
          )}
        >
          <span className="[&>svg]:h-3 [&>svg]:w-3 md:[&>svg]:h-4 md:[&>svg]:w-4">{icon}</span>
          <span className="max-w-[100px] truncate">{displayLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-4 bg-card border-border-subtle shadow-lg" 
        align="center" 
        sideOffset={8}
      >
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground mb-3">{label}</h4>
          {children}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const QuickFilters = ({ assetType }: QuickFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const hasActiveFilters = () => {
    return (
      filters.price !== null ||
      filters.guests !== null ||
      filters.beds !== null ||
      filters.brand.length > 0 ||
      filters.bodyStyle.length > 0 ||
      filters.seats !== null ||
      filters.length !== null
    );
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const getFiltersForType = () => {
    switch (assetType) {
      case "Cars":
        return (
          <>
            <FilterPill 
              icon={<DollarSign className="h-4 w-4" />} 
              label="Price"
              activeLabel={getPriceLabel(filters.price, 2000, "Cars")}
              isActive={filters.price !== null}
            >
              <PriceRangeSlider
                value={filters.price}
                onChange={(val) => updateFilter("price", val)}
                min={0}
                max={2000}
                step={50}
                prefix="$"
              />
              {filters.price && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-muted-foreground"
                  onClick={() => updateFilter("price", null)}
                >
                  Clear
                </Button>
              )}
            </FilterPill>
            <FilterPill 
              icon={<Car className="h-4 w-4" />} 
              label="Brand"
              activeLabel={getMultiSelectLabel(filters.brand, "brand", "brands")}
              isActive={filters.brand.length > 0}
            >
              <BrandGrid
                selected={filters.brand}
                onChange={(val) => updateFilter("brand", val)}
              />
              {filters.brand.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-muted-foreground"
                  onClick={() => updateFilter("brand", [])}
                >
                  Clear ({filters.brand.length} selected)
                </Button>
              )}
            </FilterPill>
            <FilterPill 
              icon={<Users className="h-4 w-4" />} 
              label="Seats"
              activeLabel={filters.seats ? `${filters.seats}+ seats` : undefined}
              isActive={filters.seats !== null}
            >
              <Counter
                value={filters.seats}
                onChange={(val) => updateFilter("seats", val)}
                min={2}
                max={8}
                label="Minimum seats"
              />
              {filters.seats && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-muted-foreground"
                  onClick={() => updateFilter("seats", null)}
                >
                  Clear
                </Button>
              )}
            </FilterPill>
            <FilterPill 
              icon={<Gauge className="h-4 w-4" />} 
              label="Body Style"
              activeLabel={getMultiSelectLabel(filters.bodyStyle, "style", "styles")}
              isActive={filters.bodyStyle.length > 0}
            >
              <BodyStyleList
                selected={filters.bodyStyle}
                onChange={(val) => updateFilter("bodyStyle", val)}
              />
              {filters.bodyStyle.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-muted-foreground"
                  onClick={() => updateFilter("bodyStyle", [])}
                >
                  Clear ({filters.bodyStyle.length} selected)
                </Button>
              )}
            </FilterPill>
          </>
        );
      case "Yachts":
        return (
          <>
            <FilterPill 
              icon={<DollarSign className="h-4 w-4" />} 
              label="Price"
              activeLabel={getPriceLabel(filters.price, 50000, "Yachts")}
              isActive={filters.price !== null}
            >
              <PriceRangeSlider
                value={filters.price}
                onChange={(val) => updateFilter("price", val)}
                min={0}
                max={50000}
                step={1000}
                prefix="$"
              />
              {filters.price && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-muted-foreground"
                  onClick={() => updateFilter("price", null)}
                >
                  Clear
                </Button>
              )}
            </FilterPill>
            <FilterPill 
              icon={<Users className="h-4 w-4" />} 
              label="Guests"
              activeLabel={filters.guests ? `${filters.guests}+ guests` : undefined}
              isActive={filters.guests !== null}
            >
              <Counter
                value={filters.guests}
                onChange={(val) => updateFilter("guests", val)}
                min={1}
                max={20}
                label="Minimum guests"
              />
              {filters.guests && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-muted-foreground"
                  onClick={() => updateFilter("guests", null)}
                >
                  Clear
                </Button>
              )}
            </FilterPill>
            <FilterPill 
              icon={<Ruler className="h-4 w-4" />} 
              label="Length"
              activeLabel={getLengthLabel(filters.length)}
              isActive={filters.length !== null}
            >
              <LengthRangeSlider
                value={filters.length}
                onChange={(val) => updateFilter("length", val)}
              />
              {filters.length && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-muted-foreground"
                  onClick={() => updateFilter("length", null)}
                >
                  Clear
                </Button>
              )}
            </FilterPill>
          </>
        );
      default: // Stays
        return (
          <>
            <FilterPill 
              icon={<DollarSign className="h-4 w-4" />} 
              label="Price"
              activeLabel={getPriceLabel(filters.price, 10000, "Stays")}
              isActive={filters.price !== null}
            >
              <PriceRangeSlider
                value={filters.price}
                onChange={(val) => updateFilter("price", val)}
                min={0}
                max={10000}
                step={100}
                prefix="$"
              />
              {filters.price && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-muted-foreground"
                  onClick={() => updateFilter("price", null)}
                >
                  Clear
                </Button>
              )}
            </FilterPill>
            <FilterPill 
              icon={<Users className="h-4 w-4" />} 
              label="Guests"
              activeLabel={filters.guests ? `${filters.guests}+ guests` : undefined}
              isActive={filters.guests !== null}
            >
              <Counter
                value={filters.guests}
                onChange={(val) => updateFilter("guests", val)}
                min={1}
                max={16}
                label="Minimum guests"
              />
              {filters.guests && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-muted-foreground"
                  onClick={() => updateFilter("guests", null)}
                >
                  Clear
                </Button>
              )}
            </FilterPill>
            <FilterPill 
              icon={<BedDouble className="h-4 w-4" />} 
              label="Beds"
              activeLabel={filters.beds ? `${filters.beds}+ beds` : undefined}
              isActive={filters.beds !== null}
            >
              <Counter
                value={filters.beds}
                onChange={(val) => updateFilter("beds", val)}
                min={1}
                max={10}
                label="Minimum beds"
              />
              {filters.beds && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-muted-foreground"
                  onClick={() => updateFilter("beds", null)}
                >
                  Clear
                </Button>
              )}
            </FilterPill>
          </>
        );
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 md:gap-3 transition-all duration-300">
      {getFiltersForType()}
      {hasActiveFilters() && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors ml-2"
        >
          <X className="h-3 w-3" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};

export default QuickFilters;
