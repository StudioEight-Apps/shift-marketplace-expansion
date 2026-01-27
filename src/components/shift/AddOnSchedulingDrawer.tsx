import { useState, useMemo } from "react";
import { format, addDays, differenceInDays } from "date-fns";
import { Calendar as CalendarIcon, Clock, Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { Listing } from "./ListingCard";

interface AddOnSchedulingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Listing;
  type: "Cars" | "Yachts";
  stayCheckIn: Date;
  stayCheckOut: Date;
  onConfirm: (scheduleData: CarSchedule | YachtSchedule) => void;
}

interface CarSchedule {
  type: "car";
  pickup: Date;
  dropoff: Date;
  days: number;
}

interface YachtSchedule {
  type: "yacht";
  date: Date;
  startTime: string;
  endTime: string;
  hours: number;
}

type Step = "intent" | "schedule" | "confirm";

const durationOptions = [
  { value: 1, label: "1 day" },
  { value: 2, label: "2 days" },
  { value: 3, label: "3 days" },
  { value: 5, label: "5 days" },
  { value: -1, label: "Entire stay" },
];

const yachtHourOptions = [
  { value: 4, label: "4 hours" },
  { value: 6, label: "6 hours" },
  { value: 8, label: "8 hours" },
];

const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

const AddOnSchedulingDrawer = ({
  open,
  onOpenChange,
  item,
  type,
  stayCheckIn,
  stayCheckOut,
  onConfirm,
}: AddOnSchedulingDrawerProps) => {
  const [step, setStep] = useState<Step>("intent");
  
  // Car state
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [carStartDate, setCarStartDate] = useState<Date | null>(null);
  
  // Yacht state
  const [yachtDate, setYachtDate] = useState<Date | null>(null);
  const [yachtHours, setYachtHours] = useState<number | null>(null);
  const [yachtStartTime, setYachtStartTime] = useState<string | null>(null);

  const stayDuration = differenceInDays(stayCheckOut, stayCheckIn);

  // Calculate car end date based on duration
  const carEndDate = useMemo(() => {
    if (!carStartDate || !selectedDuration) return null;
    const days = selectedDuration === -1 ? stayDuration : selectedDuration;
    return addDays(carStartDate, days);
  }, [carStartDate, selectedDuration, stayDuration]);

  // Calculate yacht end time
  const yachtEndTime = useMemo(() => {
    if (!yachtStartTime || !yachtHours) return null;
    const [hours] = yachtStartTime.split(":").map(Number);
    const endHour = hours + yachtHours;
    return `${endHour.toString().padStart(2, "0")}:00`;
  }, [yachtStartTime, yachtHours]);

  const handleDurationSelect = (duration: number) => {
    setSelectedDuration(duration);
    // Default to check-in date
    setCarStartDate(stayCheckIn);
    setStep("schedule");
  };

  const handleYachtDaySelect = (date: Date) => {
    setYachtDate(date);
  };

  const handleYachtHoursSelect = (hours: number) => {
    setYachtHours(hours);
    setYachtStartTime("10:00"); // Default start time
    setStep("schedule");
  };

  const handleConfirm = () => {
    if (type === "Cars" && carStartDate && carEndDate) {
      const days = selectedDuration === -1 ? stayDuration : selectedDuration!;
      onConfirm({
        type: "car",
        pickup: carStartDate,
        dropoff: carEndDate,
        days,
      });
    } else if (type === "Yachts" && yachtDate && yachtStartTime && yachtEndTime && yachtHours) {
      onConfirm({
        type: "yacht",
        date: yachtDate,
        startTime: yachtStartTime,
        endTime: yachtEndTime,
        hours: yachtHours,
      });
    }
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep("intent");
    setSelectedDuration(null);
    setCarStartDate(null);
    setYachtDate(null);
    setYachtHours(null);
    setYachtStartTime(null);
    onOpenChange(false);
  };

  const isReadyToConfirm = type === "Cars" 
    ? carStartDate && carEndDate
    : yachtDate && yachtStartTime && yachtHours;

  // Get summary text
  const getSummaryText = () => {
    if (type === "Cars" && carStartDate && carEndDate) {
      return `Scheduled for ${format(carStartDate, "MMM d")} – ${format(carEndDate, "MMM d")}`;
    }
    if (type === "Yachts" && yachtDate && yachtHours) {
      return `Scheduled for ${format(yachtDate, "MMM d")}, ${yachtHours} hours`;
    }
    return "";
  };

  const actualDays = selectedDuration === -1 ? stayDuration : selectedDuration || 0;
  const price = type === "Cars" ? item.price * actualDays : item.price * (yachtHours || 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-card border-border overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border-subtle">
          <SheetTitle className="text-foreground">Add to your stay</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            {format(stayCheckIn, "MMM d")} – {format(stayCheckOut, "MMM d")}
          </SheetDescription>
        </SheetHeader>

        {/* Selected Item Preview */}
        <div className="flex gap-4 py-4 border-b border-border-subtle">
          <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground text-sm line-clamp-1">{item.title}</h3>
            <p className="text-sm text-primary font-semibold">
              ${item.price.toLocaleString()}<span className="text-muted-foreground font-normal">/{type === "Cars" ? "day" : "hr"}</span>
            </p>
          </div>
        </div>

        <div className="py-6 space-y-6">
          {/* Step 1: Intent */}
          {step === "intent" && type === "Cars" && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">How many days will you need the car?</h4>
              <div className="flex flex-wrap gap-2">
                {durationOptions.map((option) => {
                  // Filter out options longer than stay
                  if (option.value !== -1 && option.value > stayDuration) return null;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleDurationSelect(option.value)}
                      className={cn(
                        "px-4 py-2.5 rounded-full text-sm font-medium transition-all",
                        "bg-secondary/50 text-foreground hover:bg-secondary",
                        "border border-border-subtle hover:border-primary/50"
                      )}
                    >
                      {option.value === -1 ? `Entire stay (${stayDuration} days)` : option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === "intent" && type === "Yachts" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">Which day during your stay?</h4>
                <Calendar
                  mode="single"
                  selected={yachtDate || undefined}
                  onSelect={(date) => date && handleYachtDaySelect(date)}
                  disabled={(date) => date < stayCheckIn || date > stayCheckOut}
                  modifiers={{ stayWindow: { from: stayCheckIn, to: stayCheckOut } }}
                  modifiersStyles={{
                    stayWindow: { 
                      backgroundColor: "hsl(var(--primary) / 0.1)",
                      borderRadius: 0,
                    }
                  }}
                  className="rounded-lg border border-border-subtle bg-background/50 p-3 pointer-events-auto"
                />
              </div>

              {yachtDate && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <h4 className="text-sm font-medium text-foreground">How long on the water?</h4>
                  <div className="flex flex-wrap gap-2">
                    {yachtHourOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleYachtHoursSelect(option.value)}
                        className={cn(
                          "px-4 py-2.5 rounded-full text-sm font-medium transition-all",
                          "bg-secondary/50 text-foreground hover:bg-secondary",
                          "border border-border-subtle hover:border-primary/50"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Schedule */}
          {step === "schedule" && type === "Cars" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">Select start date</h4>
                <button 
                  onClick={() => setStep("intent")}
                  className="text-xs text-primary hover:underline"
                >
                  Change duration
                </button>
              </div>
              
              <div className="text-sm text-muted-foreground mb-2">
                {actualDays} {actualDays === 1 ? "day" : "days"} rental
              </div>

              <Calendar
                mode="single"
                selected={carStartDate || undefined}
                onSelect={(date) => date && setCarStartDate(date)}
                disabled={(date) => {
                  // Disable dates outside stay window
                  if (date < stayCheckIn) return true;
                  // Ensure there's room for the full duration
                  const endDate = addDays(date, actualDays);
                  if (endDate > stayCheckOut) return true;
                  return false;
                }}
                modifiers={{ stayWindow: { from: stayCheckIn, to: stayCheckOut } }}
                modifiersStyles={{
                  stayWindow: { 
                    backgroundColor: "hsl(var(--primary) / 0.1)",
                    borderRadius: 0,
                  }
                }}
                className="rounded-lg border border-border-subtle bg-background/50 p-3 pointer-events-auto"
              />

              {carStartDate && carEndDate && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 animate-in fade-in">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <span className="text-foreground font-medium">{getSummaryText()}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "schedule" && type === "Yachts" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">Select start time</h4>
                <button 
                  onClick={() => setStep("intent")}
                  className="text-xs text-primary hover:underline"
                >
                  Change day/duration
                </button>
              </div>

              <div className="text-sm text-muted-foreground mb-2">
                {format(yachtDate!, "EEEE, MMMM d")} · {yachtHours} hours
              </div>

              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((time) => {
                  const [hours] = time.split(":").map(Number);
                  // Disable times that would end too late (after 8pm)
                  const wouldEndAt = hours + (yachtHours || 0);
                  const isDisabled = wouldEndAt > 20;
                  
                  return (
                    <button
                      key={time}
                      onClick={() => !isDisabled && setYachtStartTime(time)}
                      disabled={isDisabled}
                      className={cn(
                        "px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        isDisabled && "opacity-40 cursor-not-allowed",
                        yachtStartTime === time
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/50 text-foreground hover:bg-secondary border border-border-subtle"
                      )}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>

              {yachtStartTime && yachtEndTime && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 animate-in fade-in">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-foreground font-medium">
                      {format(yachtDate!, "MMM d")} · {yachtStartTime} – {yachtEndTime}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isReadyToConfirm && (
          <div className="sticky bottom-0 pt-4 pb-2 border-t border-border-subtle bg-card animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Add-on total</span>
              <span className="text-lg font-semibold text-primary">${price.toLocaleString()}</span>
            </div>
            <Button 
              onClick={handleConfirm}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
              size="lg"
            >
              <Check className="h-4 w-4 mr-2" />
              Add to Trip
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default AddOnSchedulingDrawer;
export type { CarSchedule, YachtSchedule };
