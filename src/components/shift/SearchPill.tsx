import { useState } from "react";
import { Search, ChevronDown, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cities, type City } from "./CitySelector";
import type { DateRange } from "react-day-picker";

type AssetType = "Stays" | "Cars" | "Yachts";

interface SearchPillProps {
  selectedCityId: string;
  onCityChange: (cityId: string) => void;
  selectedType: AssetType;
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (start: Date | null, end: Date | null) => void;
  onSearch?: () => void;
}

const SearchPill = ({
  selectedCityId,
  onCityChange,
  selectedType,
  startDate,
  endDate,
  onDateChange,
  onSearch,
}: SearchPillProps) => {
  const [cityOpen, setCityOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState<Date>(startDate || new Date());
  
  const selectedCity = cities.find(c => c.id === selectedCityId);
  const isSingleDayMode = selectedType === "Cars" || selectedType === "Yachts";

  // Auto-advance: when city is selected, open date picker
  const handleCitySelect = (cityId: string) => {
    onCityChange(cityId);
    setCityOpen(false);
    // Small delay to allow popover transition
    setTimeout(() => setDateOpen(true), 150);
  };
  
  // Determine if search is enabled (dates are selected)
  const hasValidDates = isSingleDayMode ? startDate !== null : (startDate !== null && endDate !== null);
  
  const cityLabel = selectedCity ? `${selectedCity.name}, ${selectedCity.state}` : "Where";
  
  // Format date display
  const getDateLabel = () => {
    if (!startDate) return "Add dates";
    if (isSingleDayMode || !endDate) {
      return format(startDate, "MMM d");
    }
    return `${format(startDate, "MMM d")} – ${format(endDate, "MMM d")}`;
  };

  // Handle date selection based on mode
  const handleDayClick = (day: Date) => {
    // Update display month to the selected day's month
    setDisplayMonth(day);
    
    if (isSingleDayMode) {
      onDateChange(day, null);
      setDateOpen(false);
      // Trigger search after date selection
      setTimeout(() => onSearch?.(), 100);
    } else {
      // Range mode
      if (!startDate || (startDate && endDate)) {
        onDateChange(day, null);
      } else {
        if (day < startDate) {
          onDateChange(day, null);
        } else {
          onDateChange(startDate, day);
          setDateOpen(false);
          // Trigger search after range complete
          setTimeout(() => onSearch?.(), 100);
        }
      }
    }
  };

  const handleSearchClick = () => {
    if (hasValidDates) {
      onSearch?.();
    }
  };

  const dateRange: DateRange | undefined = !isSingleDayMode && startDate && endDate
    ? { from: startDate, to: endDate }
    : !isSingleDayMode && startDate
    ? { from: startDate, to: undefined }
    : undefined;

  const minDate = new Date();

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center bg-secondary/40 border border-border-subtle rounded-full shadow-sm hover:shadow-md transition-shadow">
        {/* Where Segment */}
        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 hover:bg-secondary/60 rounded-l-full transition-colors">
              <span className="text-xs text-muted-foreground">Where</span>
              <span className="text-sm font-medium text-foreground flex items-center gap-1 whitespace-nowrap">
                {selectedCity ? selectedCity.name : "Choose city"}
                <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 bg-card border-border-subtle" align="start">
            <div className="space-y-1">
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleCitySelect(city.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                    selectedCityId === city.id
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  {city.name}, {city.state}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Vertical Divider */}
        <div className="w-px h-8 bg-border-subtle" />

        {/* When Segment */}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 hover:bg-secondary/60 transition-colors">
              <span className="text-xs text-muted-foreground">When</span>
              <span className="text-sm font-medium text-foreground flex items-center gap-1 whitespace-nowrap">
                {getDateLabel()}
                <CalendarIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-border-subtle mx-4" align="center" sideOffset={8}>
            <div className="p-3 pb-0">
              <p className="text-xs text-muted-foreground mb-2 text-center">
                {selectedCity 
                  ? `When are you visiting ${selectedCity.name}?`
                  : isSingleDayMode ? "Select a date" : "Select check-in and check-out"}
              </p>
            </div>
            {isSingleDayMode ? (
              <Calendar
                mode="single"
                selected={startDate || undefined}
                onDayClick={handleDayClick}
                month={displayMonth}
                onMonthChange={setDisplayMonth}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                numberOfMonths={1}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            ) : (
              <Calendar
                mode="range"
                selected={dateRange}
                onDayClick={handleDayClick}
                month={displayMonth}
                onMonthChange={setDisplayMonth}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                numberOfMonths={1}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            )}
          </PopoverContent>
        </Popover>

        {/* Search Button with Tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={handleSearchClick}
                disabled={!hasValidDates}
                className={cn(
                  "flex items-center justify-center h-8 w-8 md:h-9 md:w-9 mr-1.5 md:mr-2 rounded-full transition-all",
                  hasValidDates 
                    ? "bg-accent text-accent-foreground hover:opacity-90 cursor-pointer" 
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                )}
              >
                <Search className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            {!hasValidDates && (
              <TooltipContent side="bottom" className="bg-popover text-popover-foreground border-border-subtle">
                <p>Select dates to search</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default SearchPill;
