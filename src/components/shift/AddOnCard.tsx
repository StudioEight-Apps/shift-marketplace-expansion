import { useState } from "react";
import { Plus, Check, Calendar, Clock, X } from "lucide-react";
import { format, isAfter, isBefore, isEqual } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { Listing } from "./ListingCard";

interface AddOnCardProps {
  item: Listing;
  type: "Cars" | "Yachts";
  isSelected: boolean;
  priceUnit: string;
  stayCheckIn: Date | null;
  stayCheckOut: Date | null;
  // Car specific
  carPickup?: Date | null;
  carDropoff?: Date | null;
  onCarDatesChange?: (pickup: Date | null, dropoff: Date | null) => void;
  // Yacht specific
  yachtDate?: Date | null;
  yachtStartTime?: string | null;
  yachtEndTime?: string | null;
  onYachtBookingChange?: (date: Date | null, startTime: string | null, endTime: string | null) => void;
  onToggle: () => void;
}

const timeOptions = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

const AddOnCard = ({
  item,
  type,
  isSelected,
  priceUnit,
  stayCheckIn,
  stayCheckOut,
  carPickup,
  carDropoff,
  onCarDatesChange,
  yachtDate,
  yachtStartTime,
  yachtEndTime,
  onYachtBookingChange,
  onToggle,
}: AddOnCardProps) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Validate date is within stay window
  const isDateValid = (date: Date) => {
    if (!stayCheckIn || !stayCheckOut) return true;
    return !isBefore(date, stayCheckIn) && !isAfter(date, stayCheckOut);
  };

  // Handle car date selection
  const handleCarDateSelect = (date: Date | undefined, isPickup: boolean) => {
    if (!date || !onCarDatesChange) return;
    
    if (isPickup) {
      // If new pickup is after current dropoff, set dropoff to same as pickup
      if (carDropoff && isAfter(date, carDropoff)) {
        onCarDatesChange(date, date);
      } else {
        onCarDatesChange(date, carDropoff || null);
      }
    } else {
      // If new dropoff is before current pickup, set pickup to same as dropoff
      if (carPickup && isBefore(date, carPickup)) {
        onCarDatesChange(date, date);
      } else {
        onCarDatesChange(carPickup || null, date);
      }
    }
  };

  // Handle yacht date selection
  const handleYachtDateSelect = (date: Date | undefined) => {
    if (!date || !onYachtBookingChange) return;
    onYachtBookingChange(date, yachtStartTime || "10:00", yachtEndTime || "14:00");
  };

  // Handle yacht time selection
  const handleTimeChange = (time: string, isStart: boolean) => {
    if (!onYachtBookingChange) return;
    if (isStart) {
      // Ensure end time is after start time
      const startIdx = timeOptions.indexOf(time);
      const endIdx = timeOptions.indexOf(yachtEndTime || "14:00");
      const newEndTime = endIdx <= startIdx ? timeOptions[Math.min(startIdx + 4, timeOptions.length - 1)] : yachtEndTime;
      onYachtBookingChange(yachtDate || null, time, newEndTime || "14:00");
    } else {
      onYachtBookingChange(yachtDate || null, yachtStartTime || "10:00", time);
    }
  };

  // Get display text for dates
  const getCarDatesDisplay = () => {
    if (!carPickup || !carDropoff) return "Select dates";
    return `${format(carPickup, "MMM d")} - ${format(carDropoff, "MMM d")}`;
  };

  const getYachtDisplay = () => {
    if (!yachtDate) return "Select date & time";
    return `${format(yachtDate, "MMM d")} • ${yachtStartTime || "10:00"} - ${yachtEndTime || "14:00"}`;
  };

  return (
    <div className="snap-start flex-shrink-0 w-52">
      <div
        className={cn(
          "w-full text-left rounded-xl overflow-hidden bg-secondary/30 border transition-all",
          isSelected 
            ? "border-primary ring-1 ring-primary" 
            : "border-border-subtle hover:border-primary/50"
        )}
      >
        {/* Image */}
        <button
          onClick={onToggle}
          className="w-full relative aspect-[4/3] overflow-hidden"
        >
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          {isSelected && (
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </button>
        
        {/* Content */}
        <div className="p-3 space-y-2">
          <h4 className="text-sm font-medium text-foreground line-clamp-1">
            {item.title}
          </h4>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-primary">
                ${item.price.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">
                {priceUnit}
              </span>
            </div>
            
            {!isSelected && (
              <button
                onClick={onToggle}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            )}
          </div>

          {/* Inline Date Picker - Only show when selected */}
          {isSelected && (
            <div className="pt-2 border-t border-border-subtle space-y-2">
              {type === "Cars" && (
                <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-auto py-2 px-2 justify-start text-left font-normal bg-background/50 hover:bg-background/80"
                    >
                      <Calendar className="h-3.5 w-3.5 mr-2 text-primary" />
                      <span className="text-xs">{getCarDatesDisplay()}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="top">
                    <div className="p-3 border-b border-border">
                      <p className="text-xs text-muted-foreground">Car rental dates (within your stay)</p>
                    </div>
                    <div className="flex">
                      <div className="border-r border-border">
                        <p className="text-xs text-center py-2 text-muted-foreground">Pick-up</p>
                        <CalendarComponent
                          mode="single"
                          selected={carPickup || undefined}
                          onSelect={(date) => handleCarDateSelect(date, true)}
                          disabled={(date) => !isDateValid(date)}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-center py-2 text-muted-foreground">Drop-off</p>
                        <CalendarComponent
                          mode="single"
                          selected={carDropoff || undefined}
                          onSelect={(date) => handleCarDateSelect(date, false)}
                          disabled={(date) => !isDateValid(date)}
                          className="p-3 pointer-events-auto"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {type === "Yachts" && (
                <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-auto py-2 px-2 justify-start text-left font-normal bg-background/50 hover:bg-background/80"
                    >
                      <Clock className="h-3.5 w-3.5 mr-2 text-primary" />
                      <span className="text-xs">{getYachtDisplay()}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="top">
                    <div className="p-3 border-b border-border">
                      <p className="text-xs text-muted-foreground">Yacht charter date & time</p>
                    </div>
                    <div className="flex">
                      <div className="border-r border-border">
                        <CalendarComponent
                          mode="single"
                          selected={yachtDate || undefined}
                          onSelect={handleYachtDateSelect}
                          disabled={(date) => !isDateValid(date)}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </div>
                      <div className="p-3 min-w-[140px]">
                        <p className="text-xs text-muted-foreground mb-2">Start Time</p>
                        <div className="grid grid-cols-2 gap-1 mb-4">
                          {timeOptions.slice(0, 8).map((time) => (
                            <button
                              key={`start-${time}`}
                              onClick={() => handleTimeChange(time, true)}
                              className={cn(
                                "text-xs px-2 py-1.5 rounded-md transition-colors",
                                yachtStartTime === time
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary/50 hover:bg-secondary text-foreground"
                              )}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">End Time</p>
                        <div className="grid grid-cols-2 gap-1">
                          {timeOptions.slice(4).map((time) => {
                            const startIdx = timeOptions.indexOf(yachtStartTime || "10:00");
                            const timeIdx = timeOptions.indexOf(time);
                            const isDisabled = timeIdx <= startIdx;
                            
                            return (
                              <button
                                key={`end-${time}`}
                                onClick={() => !isDisabled && handleTimeChange(time, false)}
                                disabled={isDisabled}
                                className={cn(
                                  "text-xs px-2 py-1.5 rounded-md transition-colors",
                                  isDisabled && "opacity-40 cursor-not-allowed",
                                  yachtEndTime === time
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary/50 hover:bg-secondary text-foreground"
                                )}
                              >
                                {time}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Remove button */}
              <button
                onClick={onToggle}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddOnCard;
