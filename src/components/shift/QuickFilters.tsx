import { useState, useEffect, useCallback } from "react";
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

// Snap values for price slider (in dollars)
const PRICE_SNAP_VALUES = [500, 1000, 2000, 3000, 5000, 7500, 10000];

// Distribution weights for heatline (purely visual)
const PRICE_DISTRIBUTION = [0.15, 0.25, 0.35, 0.5, 0.7, 0.45, 0.3];

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

// Format price for display
const formatPriceValue = (value: number, compact = false): string => {
  if (value >= 10000) {
    return compact ? "$10k+" : "$10,000+";
  }
  if (value >= 1000) {
    const k = value / 1000;
    if (compact) {
      return k % 1 === 0 ? `$${k}k` : `$${k.toFixed(1)}k`;
    }
    return `$${value.toLocaleString()}`;
  }
  return `$${value}`;
};

// Get price unit based on asset type
const getPriceUnit = (assetType: AssetType): string => {
  return assetType === "Stays" ? "/ night" : "/ day";
};

// Get chip label for collapsed price filter
const getPriceChipLabel = (
  price: [number, number] | null,
  assetType: AssetType
): string | undefined => {
  if (!price) return undefined;
  const [min, max] = price;
  const unit = getPriceUnit(assetType);
  
  if (min === PRICE_SNAP_VALUES[0] && max >= 10000) {
    return undefined; // Full range, no label needed
  }
  
  const minLabel = formatPriceValue(min, true);
  const maxLabel = formatPriceValue(max, true);
  
  if (max >= 10000) {
    return `${minLabel}+ ${unit}`;
  }
  
  return `${minLabel}–${maxLabel} ${unit}`;
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

// Price Slider with snap values and heatline
const PriceSlider = ({ 
  value, 
  onChange,
  assetType,
  isOpen
}: { 
  value: [number, number] | null; 
  onChange: (val: [number, number] | null) => void;
  assetType: AssetType;
  isOpen: boolean;
}) => {
  const snapValues = PRICE_SNAP_VALUES;
  const minIndex = value ? snapValues.indexOf(value[0]) : 0;
  const maxIndex = value ? snapValues.indexOf(value[1]) : snapValues.length - 1;
  
  const [localMin, setLocalMin] = useState(minIndex >= 0 ? minIndex : 0);
  const [localMax, setLocalMax] = useState(maxIndex >= 0 ? maxIndex : snapValues.length - 1);
  const [isDragging, setIsDragging] = useState(false);

  // Sync with external value
  useEffect(() => {
    if (!isDragging) {
      const newMinIndex = value ? snapValues.indexOf(value[0]) : 0;
      const newMaxIndex = value ? snapValues.indexOf(value[1]) : snapValues.length - 1;
      setLocalMin(newMinIndex >= 0 ? newMinIndex : 0);
      setLocalMax(newMaxIndex >= 0 ? newMaxIndex : snapValues.length - 1);
    }
  }, [value, isDragging, snapValues]);

  const handleMinChange = useCallback((index: number) => {
    const clampedIndex = Math.min(index, localMax);
    setLocalMin(clampedIndex);
  }, [localMax]);

  const handleMaxChange = useCallback((index: number) => {
    const clampedIndex = Math.max(index, localMin);
    setLocalMax(clampedIndex);
  }, [localMin]);

  const commitChange = useCallback(() => {
    setIsDragging(false);
    const minVal = snapValues[localMin];
    const maxVal = snapValues[localMax];
    
    // If full range selected, set to null
    if (localMin === 0 && localMax === snapValues.length - 1) {
      onChange(null);
    } else {
      onChange([minVal, maxVal]);
    }
  }, [localMin, localMax, snapValues, onChange]);

  const getPositionPercent = (index: number) => {
    return (index / (snapValues.length - 1)) * 100;
  };

  const unit = getPriceUnit(assetType);
  const displayMin = formatPriceValue(snapValues[localMin]);
  const displayMax = formatPriceValue(snapValues[localMax]);

  if (!isOpen) return null;

  return (
    <div className="pt-4 pb-2 px-1">
      {/* Distribution heatline backdrop */}
      <div className="relative h-6 mb-2">
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-[2px] h-full">
          {PRICE_DISTRIBUTION.map((weight, i) => (
            <div
              key={i}
              className="flex-1 bg-muted-foreground/10 rounded-t-sm"
              style={{ height: `${weight * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* Slider track */}
      <div className="relative h-4 flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-[3px] bg-secondary rounded-full" />
        
        {/* Active range */}
        <div 
          className="absolute h-[3px] bg-foreground/60 rounded-full"
          style={{
            left: `${getPositionPercent(localMin)}%`,
            right: `${100 - getPositionPercent(localMax)}%`
          }}
        />

        {/* Min handle */}
        <input
          type="range"
          min={0}
          max={snapValues.length - 1}
          step={1}
          value={localMin}
          onChange={(e) => {
            setIsDragging(true);
            handleMinChange(parseInt(e.target.value));
          }}
          onMouseUp={commitChange}
          onTouchEnd={commitChange}
          className="absolute inset-0 w-full appearance-none bg-transparent cursor-pointer z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3.5
            [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-foreground
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-background
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-3.5
            [&::-moz-range-thumb]:h-3.5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-foreground
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-background
            [&::-moz-range-thumb]:shadow-sm
            [&::-moz-range-thumb]:cursor-grab"
          style={{ pointerEvents: 'auto' }}
        />

        {/* Max handle */}
        <input
          type="range"
          min={0}
          max={snapValues.length - 1}
          step={1}
          value={localMax}
          onChange={(e) => {
            setIsDragging(true);
            handleMaxChange(parseInt(e.target.value));
          }}
          onMouseUp={commitChange}
          onTouchEnd={commitChange}
          className="absolute inset-0 w-full appearance-none bg-transparent cursor-pointer z-20
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3.5
            [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-foreground
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-background
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-3.5
            [&::-moz-range-thumb]:h-3.5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-foreground
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-background
            [&::-moz-range-thumb]:shadow-sm
            [&::-moz-range-thumb]:cursor-grab"
          style={{ pointerEvents: 'auto' }}
        />
      </div>

      {/* Live range display */}
      <div className="text-center mt-4">
        <span className="text-sm font-medium text-foreground tabular-nums">
          {displayMin} – {displayMax} {unit}
        </span>
      </div>
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

// Price Filter Pill with inline slider (no popover)
const PriceFilterPill = ({ 
  value,
  onChange,
  assetType
}: { 
  value: [number, number] | null;
  onChange: (val: [number, number] | null) => void;
  assetType: AssetType;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const chipLabel = getPriceChipLabel(value, assetType);
  const isActive = value !== null;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all duration-200",
          isActive 
            ? "bg-foreground text-background font-medium" 
            : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
        )}
      >
        <DollarSign className="h-4 w-4 opacity-70" />
        <span className="max-w-[140px] truncate">{chipLabel || "Price"}</span>
        {isActive && (
          <button
            onClick={handleClear}
            className="ml-1 p-0.5 rounded-full hover:bg-background/20 transition-colors"
            aria-label="Clear price filter"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-card border border-border/40 rounded-xl shadow-elevated p-4 z-50">
          <PriceSlider
            value={value}
            onChange={onChange}
            assetType={assetType}
            isOpen={isOpen}
          />
        </div>
      )}
    </div>
  );
};

// Filter Pill Component (for non-price filters)
const FilterPill = ({ 
  icon, 
  label, 
  activeLabel,
  isActive,
  children,
  wide = false,
  onClear
}: { 
  icon: React.ReactNode; 
  label: string; 
  activeLabel?: string;
  isActive: boolean;
  children: React.ReactNode;
  wide?: boolean;
  onClear?: () => void;
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
            <PriceFilterPill
              value={filters.price}
              onChange={(val) => updateFilter("price", val)}
              assetType="Cars"
            />
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
            <PriceFilterPill
              value={filters.price}
              onChange={(val) => updateFilter("price", val)}
              assetType="Yachts"
            />
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
            <PriceFilterPill
              value={filters.price}
              onChange={(val) => updateFilter("price", val)}
              assetType="Stays"
            />
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
