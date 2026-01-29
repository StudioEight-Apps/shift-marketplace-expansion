import { useState, useEffect, useRef } from "react";
import { DollarSign, Users, BedDouble, Car, Ruler, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

// Brand data with logos (using brand initials as placeholder for actual logos)
const carBrands = [
  { name: "Ferrari", logo: "FE" },
  { name: "Lamborghini", logo: "LM" },
  { name: "Porsche", logo: "PR" },
  { name: "Mercedes", logo: "MB" },
  { name: "McLaren", logo: "MC" },
  { name: "Bentley", logo: "BT" },
  { name: "Rolls-Royce", logo: "RR" },
  { name: "Aston Martin", logo: "AM" },
  { name: "BMW", logo: "BM" },
  { name: "Range Rover", logo: "RR" },
];

// Body style icons using thin-line SVG paths
const bodyStyleIcons: Record<string, React.ReactNode> = {
  "Convertible": (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14v-3l-2-5H7L5 14v3z" />
      <circle cx="7.5" cy="17" r="1.5" />
      <circle cx="16.5" cy="17" r="1.5" />
      <path d="M5 9h6" />
    </svg>
  ),
  "Coupe": (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14v-3l-2-5H9L5 13v4z" />
      <circle cx="7.5" cy="17" r="1.5" />
      <circle cx="16.5" cy="17" r="1.5" />
      <path d="M9 9h6l2 4" />
    </svg>
  ),
  "SUV": (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14v-6l-1-3H6L5 11v6z" />
      <circle cx="7.5" cy="17" r="1.5" />
      <circle cx="16.5" cy="17" r="1.5" />
      <path d="M6 8h12v3H6z" />
    </svg>
  ),
  "Sedan": (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 17h16v-3l-2-5H6L4 14v3z" />
      <circle cx="7" cy="17" r="1.5" />
      <circle cx="17" cy="17" r="1.5" />
      <path d="M6 9h12l1.5 4" />
    </svg>
  ),
  "Supercar": (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 16h18v-2l-3-5H6L3 14v2z" />
      <circle cx="6.5" cy="16" r="1.5" />
      <circle cx="17.5" cy="16" r="1.5" />
      <path d="M6 9h12l2 4" />
    </svg>
  ),
};

const bodyStyles = ["SUV", "Sedan", "Coupe", "Convertible", "Supercar"];

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
    return undefined;
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
  
  if (min === 30 && max >= 150) return undefined;
  if (min === 30 && max < 150) return `Under ${max} ft`;
  if (min > 30 && max >= 150) return `${min}+ ft`;
  return `${min}-${max} ft`;
};

// Refined Counter Component
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
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onChange(currentValue <= min ? null : currentValue - 1)}
          className="h-9 w-9 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-30"
          disabled={value === null}
        >
          <span className="text-lg font-light">−</span>
        </button>
        <span className="w-10 text-center text-base font-medium text-foreground tabular-nums">
          {value ?? "Any"}
        </span>
        <button
          onClick={() => onChange(Math.min(currentValue + 1, max))}
          className="h-9 w-9 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <span className="text-lg font-light">+</span>
        </button>
      </div>
    </div>
  );
};

// Luxury Price Input Component (numeric-first)
const PriceInputs = ({ 
  value, 
  onChange,
  maxCeiling,
  step = 100
}: { 
  value: [number, number] | null; 
  onChange: (val: [number, number] | null) => void;
  maxCeiling: number;
  step?: number;
}) => {
  const [localMin, setLocalMin] = useState<string>(value?.[0]?.toString() ?? "");
  const [localMax, setLocalMax] = useState<string>(value?.[1]?.toString() ?? "");
  const minRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalMin(value?.[0]?.toString() ?? "");
    setLocalMax(value?.[1]?.toString() ?? "");
  }, [value]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setLocalMin(val);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setLocalMax(val);
  };

  const handleBlur = () => {
    const min = parseInt(localMin) || 0;
    const max = parseInt(localMax) || maxCeiling;
    
    if (min === 0 && max >= maxCeiling) {
      onChange(null);
    } else {
      onChange([Math.min(min, max), Math.max(min, max)]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
      (e.target as HTMLInputElement).blur();
    }
  };
  
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Min</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              ref={minRef}
              type="text"
              inputMode="numeric"
              value={localMin}
              onChange={handleMinChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="0"
              className="pl-7 h-11 bg-background border-border/40 text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/20"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Max</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              ref={maxRef}
              type="text"
              inputMode="numeric"
              value={localMax}
              onChange={handleMaxChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={maxCeiling >= 10000 ? `${maxCeiling / 1000}k+` : `${maxCeiling}+`}
              className="pl-7 h-11 bg-background border-border/40 text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/20"
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground/70 text-center">
        {maxCeiling >= 10000 ? `Up to $${maxCeiling / 1000}k+` : `Up to $${maxCeiling}+`}
      </p>
    </div>
  );
};

// Refined Length Input Component
const LengthInputs = ({ 
  value, 
  onChange 
}: { 
  value: [number, number] | null; 
  onChange: (val: [number, number] | null) => void;
}) => {
  const [localMin, setLocalMin] = useState<string>(value?.[0]?.toString() ?? "");
  const [localMax, setLocalMax] = useState<string>(value?.[1]?.toString() ?? "");

  useEffect(() => {
    setLocalMin(value?.[0]?.toString() ?? "");
    setLocalMax(value?.[1]?.toString() ?? "");
  }, [value]);

  const handleBlur = () => {
    const min = parseInt(localMin) || 30;
    const max = parseInt(localMax) || 150;
    
    if (min <= 30 && max >= 150) {
      onChange(null);
    } else {
      onChange([Math.min(min, max), Math.max(min, max)]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
      (e.target as HTMLInputElement).blur();
    }
  };
  
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Min</label>
          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="30"
              className="pr-8 h-11 bg-background border-border/40 text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">ft</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Max</label>
          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="150+"
              className="pr-8 h-11 bg-background border-border/40 text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">ft</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground/70 text-center">30 ft – 150+ ft</p>
    </div>
  );
};

// Brand Grid with Logos
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
    <div className="grid grid-cols-2 gap-1.5 py-2 max-h-[280px] overflow-y-auto scrollbar-dark">
      {carBrands.map(brand => (
        <button
          key={brand.name}
          onClick={() => toggleBrand(brand.name)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-left",
            selected.includes(brand.name) 
              ? "bg-foreground/10 ring-1 ring-foreground/20" 
              : "hover:bg-secondary/50"
          )}
        >
          <div className={cn(
            "w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-colors",
            selected.includes(brand.name)
              ? "bg-foreground/10 text-foreground"
              : "bg-secondary/60 text-muted-foreground"
          )}>
            {brand.logo}
          </div>
          <span className={cn(
            "text-sm transition-colors",
            selected.includes(brand.name) 
              ? "text-foreground font-medium" 
              : "text-muted-foreground"
          )}>
            {brand.name}
          </span>
        </button>
      ))}
    </div>
  );
};

// Body Style Pills
const BodyStylePills = ({ 
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
    <div className="flex flex-wrap gap-2 py-2">
      {bodyStyles.map(style => (
        <button
          key={style}
          onClick={() => toggleStyle(style)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-150",
            selected.includes(style) 
              ? "bg-foreground text-background font-medium" 
              : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <span className={cn(
            "transition-colors",
            selected.includes(style) ? "text-background" : "text-muted-foreground"
          )}>
            {bodyStyleIcons[style]}
          </span>
          <span className="text-sm">{style}</span>
        </button>
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
  children,
  wide = false
}: { 
  icon: React.ReactNode; 
  label: string; 
  activeLabel?: string;
  isActive: boolean;
  children: React.ReactNode;
  wide?: boolean;
}) => {
  const displayLabel = isActive && activeLabel ? activeLabel : label;
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all duration-200",
            isActive 
              ? "bg-foreground text-background font-medium" 
              : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          )}
        >
          <span className="[&>svg]:h-4 [&>svg]:w-4 opacity-70">{icon}</span>
          <span className="max-w-[120px] truncate">{displayLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "p-5 bg-card border-border/40 shadow-elevated",
          wide ? "w-80" : "w-72"
        )}
        align="center" 
        sideOffset={12}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
};

const QuickFilters = ({ assetType }: QuickFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  // Reset filters when asset type changes
  useEffect(() => {
    setFilters(defaultFilters);
  }, [assetType]);

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

  const renderClearButton = (onClear: () => void, count?: number) => (
    <Button 
      variant="ghost" 
      size="sm" 
      className="w-full mt-3 text-muted-foreground hover:text-foreground"
      onClick={onClear}
    >
      {count ? `Clear (${count})` : "Clear"}
    </Button>
  );

  const getFiltersForType = () => {
    switch (assetType) {
      case "Cars":
        return (
          <>
            <FilterPill 
              icon={<DollarSign />} 
              label="Price"
              activeLabel={getPriceLabel(filters.price, 2000, "Cars")}
              isActive={filters.price !== null}
            >
              <PriceInputs
                value={filters.price}
                onChange={(val) => updateFilter("price", val)}
                maxCeiling={2000}
                step={50}
              />
              {filters.price && renderClearButton(() => updateFilter("price", null))}
            </FilterPill>
            <FilterPill 
              icon={<Car />} 
              label="Brand"
              activeLabel={getMultiSelectLabel(filters.brand, "brand", "brands")}
              isActive={filters.brand.length > 0}
              wide
            >
              <BrandGrid
                selected={filters.brand}
                onChange={(val) => updateFilter("brand", val)}
              />
              {filters.brand.length > 0 && renderClearButton(() => updateFilter("brand", []), filters.brand.length)}
            </FilterPill>
            <FilterPill 
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M7 9h4M13 9h4M7 13h4M13 13h4" />
                </svg>
              } 
              label="Body Style"
              activeLabel={getMultiSelectLabel(filters.bodyStyle, "style", "styles")}
              isActive={filters.bodyStyle.length > 0}
              wide
            >
              <BodyStylePills
                selected={filters.bodyStyle}
                onChange={(val) => updateFilter("bodyStyle", val)}
              />
              {filters.bodyStyle.length > 0 && renderClearButton(() => updateFilter("bodyStyle", []), filters.bodyStyle.length)}
            </FilterPill>
          </>
        );
      case "Yachts":
        return (
          <>
            <FilterPill 
              icon={<DollarSign />} 
              label="Price"
              activeLabel={getPriceLabel(filters.price, 50000, "Yachts")}
              isActive={filters.price !== null}
            >
              <PriceInputs
                value={filters.price}
                onChange={(val) => updateFilter("price", val)}
                maxCeiling={50000}
                step={1000}
              />
              {filters.price && renderClearButton(() => updateFilter("price", null))}
            </FilterPill>
            <FilterPill 
              icon={<Users />} 
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
              {filters.guests && renderClearButton(() => updateFilter("guests", null))}
            </FilterPill>
            <FilterPill 
              icon={<Ruler />} 
              label="Length"
              activeLabel={getLengthLabel(filters.length)}
              isActive={filters.length !== null}
            >
              <LengthInputs
                value={filters.length}
                onChange={(val) => updateFilter("length", val)}
              />
              {filters.length && renderClearButton(() => updateFilter("length", null))}
            </FilterPill>
          </>
        );
      default: // Stays
        return (
          <>
            <FilterPill 
              icon={<DollarSign />} 
              label="Price"
              activeLabel={getPriceLabel(filters.price, 10000, "Stays")}
              isActive={filters.price !== null}
            >
              <PriceInputs
                value={filters.price}
                onChange={(val) => updateFilter("price", val)}
                maxCeiling={10000}
                step={100}
              />
              {filters.price && renderClearButton(() => updateFilter("price", null))}
            </FilterPill>
            <FilterPill 
              icon={<Users />} 
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
              {filters.guests && renderClearButton(() => updateFilter("guests", null))}
            </FilterPill>
            <FilterPill 
              icon={<BedDouble />} 
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
              {filters.beds && renderClearButton(() => updateFilter("beds", null))}
            </FilterPill>
          </>
        );
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 transition-all duration-300">
      {getFiltersForType()}
      {hasActiveFilters() && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 ml-3 px-3 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};

export default QuickFilters;
