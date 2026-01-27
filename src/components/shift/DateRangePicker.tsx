import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (start: Date | null, end: Date | null) => void;
  startLabel?: string;
  endLabel?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

const DateRangePicker = ({
  startDate,
  endDate,
  onDateChange,
  startLabel = "Check-in",
  endLabel = "Check-out",
  minDate,
  maxDate,
  className,
}: DateRangePickerProps) => {
  const [open, setOpen] = useState(false);

  const dateRange: DateRange | undefined = startDate && endDate
    ? { from: startDate, to: endDate }
    : startDate
    ? { from: startDate, to: undefined }
    : undefined;

  const handleSelect = (range: DateRange | undefined) => {
    onDateChange(range?.from || null, range?.to || null);
    if (range?.from && range?.to) {
      setOpen(false);
    }
  };

  const disabled = (date: Date) => {
    // Normalize dates to start of day for proper comparison
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (minDate) {
      const minStart = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
      if (dateStart < minStart) return true;
    }
    if (maxDate) {
      const maxStart = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
      if (dateStart > maxStart) return true;
    }
    return false;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("grid grid-cols-2 gap-3", className)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal h-auto py-3 px-4 bg-secondary/30 border-border-subtle hover:bg-secondary/50",
              !startDate && "text-muted-foreground"
            )}
          >
            <div className="flex flex-col items-start gap-1 w-full">
              <span className="text-xs text-muted-foreground">{startLabel}</span>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {startDate ? format(startDate, "MMM d, yyyy") : "Select date"}
                </span>
              </div>
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal h-auto py-3 px-4 bg-secondary/30 border-border-subtle hover:bg-secondary/50",
              !endDate && "text-muted-foreground"
            )}
          >
            <div className="flex flex-col items-start gap-1 w-full">
              <span className="text-xs text-muted-foreground">{endLabel}</span>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {endDate ? format(endDate, "MMM d, yyyy") : "Select date"}
                </span>
              </div>
            </div>
          </Button>
        </PopoverTrigger>
      </div>
      
      <PopoverContent className="w-auto p-0 bg-card border-border-subtle" align="start">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={handleSelect}
          disabled={disabled}
          numberOfMonths={1}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;
