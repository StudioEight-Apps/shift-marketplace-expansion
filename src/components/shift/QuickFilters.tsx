import { useState, useEffect, useCallback, useRef } from "react";
import { DollarSign, Users, BedDouble, Car, Ruler, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

type AssetType = "Stays" | "Cars" | "Yachts";

type FilterType = "price" | "guests" | "beds" | "brand" | "bodyStyle" | "length" | null;

export interface FilterState {
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
const PRICE_SNAP_VALUES = [0, 500, 1000, 2000, 3000, 5000, 7500, 10000];

// Distribution weights for heatline (purely visual)
const PRICE_DISTRIBUTION = [0.1, 0.15, 0.25, 0.35, 0.5, 0.7, 0.45, 0.3];

// Brand data with logos
const carBrands = [
  { name: "Ferrari", logo: "https://www.carlogos.org/car-logos/ferrari-logo.png" },
  { name: "Lamborghini", logo: "https://www.carlogos.org/car-logos/lamborghini-logo.png" },
  { name: "Porsche", logo: "https://www.carlogos.org/car-logos/porsche-logo.png" },
  { name: "Mercedes-Benz", logo: "https://www.carlogos.org/car-logos/mercedes-benz-logo.png" },
  { name: "McLaren", logo: "https://www.carlogos.org/car-logos/mclaren-logo.png" },
  { name: "Bentley", logo: "https://www.carlogos.org/car-logos/bentley-logo.png" },
  { name: "Rolls Royce", logo: "https://www.carlogos.org/car-logos/rolls-royce-logo.png" },
  { name: "Aston Martin", logo: "https://www.carlogos.org/car-logos/aston-martin-logo.png" },
  { name: "BMW", logo: "https://www.carlogos.org/car-logos/bmw-logo.png" },
  { name: "Chevrolet", logo: "https://www.carlogos.org/car-logos/chevrolet-logo.png" },
  { name: "Cadillac", logo: "https://www.carlogos.org/car-logos/cadillac-logo.png" },
  { name: "Range Rover", logo: "https://www.carlogos.org/car-logos/land-rover-logo.png" },
  { name: "Audi", logo: "https://www.carlogos.org/car-logos/audi-logo.png" },
  { name: "Maserati", logo: "https://www.carlogos.org/car-logos/maserati-logo.png" },
  { name: "Tesla", logo: "https://www.carlogos.org/car-logos/tesla-logo.png" },
];

// Body style icons
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
};

const bodyStyles = ["SUV", "Sedan", "Coupe", "Convertible"];

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
  if (assetType === "Stays") return "/ night";
  if (assetType === "Yachts") return "/ hr";
  return "/ day";
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
    return undefined;
  }
  
  const minLabel = formatPriceValue(min, true);
  const maxLabel = formatPriceValue(max, true);
  
  if (max >= 10000) {
    return `${minLabel}+ ${unit}`;
  }
  
  return `${minLabel}–${maxLabel} ${unit}`;
};

// Filter Modal Component
const FilterModal = ({
  isOpen,
  title,
  onApply,
  onClear,
  showClear,
  children,
  wide = false,
  alignRight = false
}: {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  onApply: () => void;
  onClear: () => void;
  showClear: boolean;
  children: React.ReactNode;
  wide?: boolean;
  alignRight?: boolean;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is inside the modal
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        // Check if click is on a filter button (parent relative container)
        const target = event.target as HTMLElement;
        const isFilterButton = target.closest('[data-filter-button]');
        if (!isFilterButton) {
          onApply();
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onApply();
      }
    };

    if (isOpen) {
      // Use setTimeout to avoid immediately closing on the same click that opened it
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onApply]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "absolute top-full mt-2 bg-popover border border-border-subtle rounded-md shadow-md z-50",
        // Wide modals (Brand): centered under trigger on mobile, left-aligned on desktop
        // Regular modals: keep a safe inset from viewport edges on mobile
        wide
          ? "left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 w-[min(20rem,calc(100vw-1.5rem))]"
          : alignRight
            ? "right-2 md:right-auto md:left-0 w-48"
            : "left-2 md:left-0 w-48"
      )}
    >
      {/* Modal Header */}
      <div className="px-3 pt-3 pb-2">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
      </div>

      {/* Modal Content */}
      <div className="px-3 pb-3">
        {children}
      </div>

      {/* Modal Footer */}
      <div className="px-3 py-2 border-t border-border-subtle flex items-center justify-between">
        {showClear ? (
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            Clear
          </button>
        ) : (
          <div />
        )}
        <Button
          size="sm"
          onClick={onApply}
          className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 text-xs font-medium"
        >
          Apply
        </Button>
      </div>
    </div>
  );
};

// Filter Button Component
const FilterButton = ({
  icon,
  label,
  isActive,
  isOpen,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      data-filter-button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition-all duration-200",
        isOpen
          ? "bg-foreground text-background font-medium ring-2 ring-foreground/20"
          : isActive
            ? "bg-foreground text-background font-medium"
            : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      )}
    >
      <span className="[&>svg]:h-3.5 [&>svg]:w-3.5 opacity-70">{icon}</span>
      <span className="max-w-[100px] truncate whitespace-nowrap">{label}</span>
      {isActive && !isOpen && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full border border-background" />
      )}
    </button>
  );
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
    <div className="flex flex-col items-center gap-2 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onChange(currentValue <= min ? null : currentValue - 1)}
          className="h-8 w-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-30"
          disabled={value === null}
        >
          <span className="text-lg font-light">−</span>
        </button>
        <span className="w-10 text-center text-base font-medium text-foreground tabular-nums">
          {value ?? "Any"}
        </span>
        <button
          onClick={() => onChange(Math.min(currentValue + 1, max))}
          className="h-8 w-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <span className="text-lg font-light">+</span>
        </button>
      </div>
    </div>
  );
};

// Price Slider Component
const PriceSlider = ({
  value,
  onChange,
  assetType
}: {
  value: [number, number] | null;
  onChange: (val: [number, number] | null) => void;
  assetType: AssetType;
}) => {
  const snapValues = PRICE_SNAP_VALUES;
  const minIndex = value ? snapValues.indexOf(value[0]) : 0;
  const maxIndex = value ? snapValues.indexOf(value[1]) : snapValues.length - 1;

  const [localMin, setLocalMin] = useState(minIndex >= 0 ? minIndex : 0);
  const [localMax, setLocalMax] = useState(maxIndex >= 0 ? maxIndex : snapValues.length - 1);
  const [isDragging, setIsDragging] = useState(false);

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

  return (
    <div className="pt-1 pb-1">
      {/* Slider track */}
      <div className="relative h-4 flex items-center">
        <div className="absolute inset-x-0 h-[2px] bg-secondary rounded-full" />

        <div
          className="absolute h-[2px] bg-foreground/60 rounded-full"
          style={{
            left: `${getPositionPercent(localMin)}%`,
            right: `${100 - getPositionPercent(localMax)}%`
          }}
        />

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
          className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-foreground
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-background
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-foreground
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-background
            [&::-moz-range-thumb]:shadow-sm
            [&::-moz-range-thumb]:cursor-grab"
        />

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
          className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none z-20
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-foreground
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-background
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-foreground
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-background
            [&::-moz-range-thumb]:shadow-sm
            [&::-moz-range-thumb]:cursor-grab"
        />
      </div>

      {/* Live range display */}
      <div className="text-center mt-3">
        <span className="text-xs font-medium text-foreground tabular-nums">
          {displayMin} – {displayMax} {unit}
        </span>
      </div>
    </div>
  );
};

// Length Slider Component
const LengthSlider = ({
  value,
  onChange
}: {
  value: [number, number] | null;
  onChange: (val: [number, number] | null) => void;
}) => {
  const lengthValues = [30, 50, 75, 100, 125, 150];
  const minIndex = value ? lengthValues.indexOf(value[0]) : 0;
  const maxIndex = value ? lengthValues.indexOf(value[1]) : lengthValues.length - 1;

  const [localMin, setLocalMin] = useState(minIndex >= 0 ? minIndex : 0);
  const [localMax, setLocalMax] = useState(maxIndex >= 0 ? maxIndex : lengthValues.length - 1);

  useEffect(() => {
    const newMinIndex = value ? lengthValues.findIndex(v => v >= (value[0] || 30)) : 0;
    const newMaxIndex = value ? lengthValues.findIndex(v => v >= (value[1] || 150)) : lengthValues.length - 1;
    setLocalMin(newMinIndex >= 0 ? newMinIndex : 0);
    setLocalMax(newMaxIndex >= 0 ? newMaxIndex : lengthValues.length - 1);
  }, [value]);

  const handleMinChange = (index: number) => {
    const clampedIndex = Math.min(index, localMax);
    setLocalMin(clampedIndex);
    updateValue(clampedIndex, localMax);
  };

  const handleMaxChange = (index: number) => {
    const clampedIndex = Math.max(index, localMin);
    setLocalMax(clampedIndex);
    updateValue(localMin, clampedIndex);
  };

  const updateValue = (minIdx: number, maxIdx: number) => {
    if (minIdx === 0 && maxIdx === lengthValues.length - 1) {
      onChange(null);
    } else {
      onChange([lengthValues[minIdx], lengthValues[maxIdx]]);
    }
  };

  const getPositionPercent = (index: number) => {
    return (index / (lengthValues.length - 1)) * 100;
  };

  const displayMin = `${lengthValues[localMin]} ft`;
  const displayMax = localMax === lengthValues.length - 1 ? "150+ ft" : `${lengthValues[localMax]} ft`;

  return (
    <div className="pt-2 pb-2">
      {/* Slider track */}
      <div className="relative h-4 flex items-center mt-4">
        <div className="absolute inset-x-0 h-[3px] bg-secondary rounded-full" />

        <div
          className="absolute h-[3px] bg-foreground/60 rounded-full"
          style={{
            left: `${getPositionPercent(localMin)}%`,
            right: `${100 - getPositionPercent(localMax)}%`
          }}
        />

        <input
          type="range"
          min={0}
          max={lengthValues.length - 1}
          step={1}
          value={localMin}
          onChange={(e) => handleMinChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-foreground
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-background
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-foreground
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-background"
        />

        <input
          type="range"
          min={0}
          max={lengthValues.length - 1}
          step={1}
          value={localMax}
          onChange={(e) => handleMaxChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none z-20
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-foreground
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-background
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-foreground
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-background"
        />
      </div>

      {/* Live range display */}
      <div className="text-center mt-4">
        <span className="text-sm font-medium text-foreground tabular-nums">
          {displayMin} – {displayMax}
        </span>
      </div>
    </div>
  );
};

// Brand Grid Component
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
    <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto scrollbar-dark">
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
          <div className="relative w-8 h-8 shrink-0">
            <img
              src={brand.logo}
              alt={brand.name}
              className="w-8 h-8 object-contain"
            />
            {selected.includes(brand.name) && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-foreground rounded-full flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-background" />
              </div>
            )}
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

// Body Style List Component
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
    <div className="space-y-1">
      {bodyStyles.map(style => (
        <button
          key={style}
          onClick={() => toggleStyle(style)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-150 text-left",
            selected.includes(style)
              ? "bg-foreground/10"
              : "hover:bg-secondary/50"
          )}
        >
          <Checkbox
            checked={selected.includes(style)}
            className="data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
          />
          <span className={cn(
            "transition-colors",
            selected.includes(style) ? "text-muted-foreground" : "text-muted-foreground"
          )}>
            {bodyStyleIcons[style]}
          </span>
          <span className={cn(
            "text-sm transition-colors",
            selected.includes(style)
              ? "text-foreground font-medium"
              : "text-muted-foreground"
          )}>
            {style}
          </span>
        </button>
      ))}
    </div>
  );
};

// Main QuickFilters Component
const QuickFilters = ({ assetType, onFiltersChange }: QuickFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [openFilter, setOpenFilter] = useState<FilterType>(null);
  const [tempFilters, setTempFilters] = useState<FilterState>(defaultFilters);

  // Reset filters when asset type changes
  useEffect(() => {
    setFilters(defaultFilters);
    setOpenFilter(null);
    onFiltersChange?.(defaultFilters);
  }, [assetType]);

  const openFilterModal = (filterType: FilterType) => {
    if (openFilter === filterType) {
      // If clicking the same filter, close it and apply
      applyTempFilters();
    } else {
      // Close current and open new
      if (openFilter) {
        applyTempFilters();
      }
      setTempFilters(filters);
      setOpenFilter(filterType);
    }
  };

  const applyTempFilters = () => {
    setFilters(tempFilters);
    setOpenFilter(null);
    onFiltersChange?.(tempFilters);
  };

  const clearCurrentFilter = () => {
    switch (openFilter) {
      case "price":
        setTempFilters(prev => ({ ...prev, price: null }));
        break;
      case "guests":
        setTempFilters(prev => ({ ...prev, guests: null }));
        break;
      case "beds":
        setTempFilters(prev => ({ ...prev, beds: null }));
        break;
      case "brand":
        setTempFilters(prev => ({ ...prev, brand: [] }));
        break;
      case "bodyStyle":
        setTempFilters(prev => ({ ...prev, bodyStyle: [] }));
        break;
      case "length":
        setTempFilters(prev => ({ ...prev, length: null }));
        break;
    }
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (filters.price !== null) count++;
    if (filters.guests !== null) count++;
    if (filters.beds !== null) count++;
    if (filters.brand.length > 0) count++;
    if (filters.bodyStyle.length > 0) count++;
    if (filters.length !== null) count++;
    return count;
  };

  const resetAllFilters = () => {
    setFilters(defaultFilters);
    setTempFilters(defaultFilters);
    setOpenFilter(null);
    onFiltersChange?.(defaultFilters);
  };

  const activeCount = getActiveFilterCount();

  const getPriceLabel = () => {
    const label = getPriceChipLabel(filters.price, assetType);
    return label || "Price";
  };

  const renderStaysFilters = () => (
    <>
      {/* Price Filter */}
      <div className="relative">
        <FilterButton
          icon={<DollarSign />}
          label={getPriceLabel()}
          isActive={filters.price !== null}
          isOpen={openFilter === "price"}
          onClick={() => openFilterModal("price")}
        />
        <FilterModal
          isOpen={openFilter === "price"}
          title="Price Range"
          onApply={applyTempFilters}
          onClear={clearCurrentFilter}
          showClear={tempFilters.price !== null}
        >
          <PriceSlider
            value={tempFilters.price}
            onChange={(val) => setTempFilters(prev => ({ ...prev, price: val }))}
            assetType={assetType}
          />
        </FilterModal>
      </div>

      {/* Guests Filter */}
      <div className="relative">
        <FilterButton
          icon={<Users />}
          label={filters.guests ? `${filters.guests}+ guests` : "Guests"}
          isActive={filters.guests !== null}
          isOpen={openFilter === "guests"}
          onClick={() => openFilterModal("guests")}
        />
        <FilterModal
          isOpen={openFilter === "guests"}
          title="Number of Guests"
          onApply={applyTempFilters}
          onClear={clearCurrentFilter}
          showClear={tempFilters.guests !== null}
        >
          <Counter
            value={tempFilters.guests}
            onChange={(val) => setTempFilters(prev => ({ ...prev, guests: val }))}
            min={1}
            max={16}
            label="Minimum guests"
          />
        </FilterModal>
      </div>

      {/* Beds Filter */}
      <div className="relative">
        <FilterButton
          icon={<BedDouble />}
          label={filters.beds ? `${filters.beds}+ beds` : "Beds"}
          isActive={filters.beds !== null}
          isOpen={openFilter === "beds"}
          onClick={() => openFilterModal("beds")}
        />
        <FilterModal
          isOpen={openFilter === "beds"}
          title="Number of Beds"
          onApply={applyTempFilters}
          onClear={clearCurrentFilter}
          showClear={tempFilters.beds !== null}
          alignRight
        >
          <Counter
            value={tempFilters.beds}
            onChange={(val) => setTempFilters(prev => ({ ...prev, beds: val }))}
            min={1}
            max={10}
            label="Minimum beds"
          />
        </FilterModal>
      </div>
    </>
  );

  const renderCarsFilters = () => (
    <>
      {/* Price Filter */}
      <div className="relative">
        <FilterButton
          icon={<DollarSign />}
          label={getPriceLabel()}
          isActive={filters.price !== null}
          isOpen={openFilter === "price"}
          onClick={() => openFilterModal("price")}
        />
        <FilterModal
          isOpen={openFilter === "price"}
          title="Price Range"
          onApply={applyTempFilters}
          onClear={clearCurrentFilter}
          showClear={tempFilters.price !== null}
        >
          <PriceSlider
            value={tempFilters.price}
            onChange={(val) => setTempFilters(prev => ({ ...prev, price: val }))}
            assetType={assetType}
          />
        </FilterModal>
      </div>

      {/* Brand Filter */}
      <div className="relative">
        <FilterButton
          icon={<Car />}
          label={filters.brand.length > 0 ? `${filters.brand.length} brands` : "Brand"}
          isActive={filters.brand.length > 0}
          isOpen={openFilter === "brand"}
          onClick={() => openFilterModal("brand")}
        />
        <FilterModal
          isOpen={openFilter === "brand"}
          title="Select Brands"
          onApply={applyTempFilters}
          onClear={clearCurrentFilter}
          showClear={tempFilters.brand.length > 0}
          wide
        >
          <BrandGrid
            selected={tempFilters.brand}
            onChange={(val) => setTempFilters(prev => ({ ...prev, brand: val }))}
          />
        </FilterModal>
      </div>

      {/* Body Style Filter */}
      <div className="relative">
        <FilterButton
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M7 9h4M13 9h4M7 13h4M13 13h4" />
            </svg>
          }
          label={filters.bodyStyle.length > 0 ? `${filters.bodyStyle.length} styles` : "Body Style"}
          isActive={filters.bodyStyle.length > 0}
          isOpen={openFilter === "bodyStyle"}
          onClick={() => openFilterModal("bodyStyle")}
        />
        <FilterModal
          isOpen={openFilter === "bodyStyle"}
          title="Body Style"
          onApply={applyTempFilters}
          onClear={clearCurrentFilter}
          showClear={tempFilters.bodyStyle.length > 0}
          alignRight
        >
          <BodyStyleList
            selected={tempFilters.bodyStyle}
            onChange={(val) => setTempFilters(prev => ({ ...prev, bodyStyle: val }))}
          />
        </FilterModal>
      </div>
    </>
  );

  const renderYachtsFilters = () => (
    <>
      {/* Price Filter */}
      <div className="relative">
        <FilterButton
          icon={<DollarSign />}
          label={getPriceLabel()}
          isActive={filters.price !== null}
          isOpen={openFilter === "price"}
          onClick={() => openFilterModal("price")}
        />
        <FilterModal
          isOpen={openFilter === "price"}
          title="Price Range"
          onApply={applyTempFilters}
          onClear={clearCurrentFilter}
          showClear={tempFilters.price !== null}
        >
          <PriceSlider
            value={tempFilters.price}
            onChange={(val) => setTempFilters(prev => ({ ...prev, price: val }))}
            assetType={assetType}
          />
        </FilterModal>
      </div>

      {/* Guests Filter */}
      <div className="relative">
        <FilterButton
          icon={<Users />}
          label={filters.guests ? `${filters.guests}+ guests` : "Guests"}
          isActive={filters.guests !== null}
          isOpen={openFilter === "guests"}
          onClick={() => openFilterModal("guests")}
        />
        <FilterModal
          isOpen={openFilter === "guests"}
          title="Number of Guests"
          onApply={applyTempFilters}
          onClear={clearCurrentFilter}
          showClear={tempFilters.guests !== null}
        >
          <Counter
            value={tempFilters.guests}
            onChange={(val) => setTempFilters(prev => ({ ...prev, guests: val }))}
            min={1}
            max={20}
            label="Minimum guests"
          />
        </FilterModal>
      </div>

      {/* Length Filter */}
      <div className="relative">
        <FilterButton
          icon={<Ruler />}
          label={filters.length ? `${filters.length[0]}-${filters.length[1]} ft` : "Length"}
          isActive={filters.length !== null}
          isOpen={openFilter === "length"}
          onClick={() => openFilterModal("length")}
        />
        <FilterModal
          isOpen={openFilter === "length"}
          title="Yacht Length"
          onApply={applyTempFilters}
          onClear={clearCurrentFilter}
          showClear={tempFilters.length !== null}
          alignRight
        >
          <LengthSlider
            value={tempFilters.length}
            onChange={(val) => setTempFilters(prev => ({ ...prev, length: val }))}
          />
        </FilterModal>
      </div>
    </>
  );

  return (
    <div className="w-full px-2 flex flex-wrap items-center justify-center gap-1.5 transition-all duration-300">
      {assetType === "Stays" && renderStaysFilters()}
      {assetType === "Cars" && renderCarsFilters()}
      {assetType === "Yachts" && renderYachtsFilters()}

      {activeCount > 0 && (
        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {activeCount} applied
          </span>
          <button
            onClick={resetAllFilters}
            className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
          >
            <X className="h-3 w-3" />
            <span>Reset</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default QuickFilters;
