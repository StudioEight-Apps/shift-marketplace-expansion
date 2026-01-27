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
  const [activeField, setActiveField] = useState<"start" | "end">("start");

  const dateRange: DateRange | undefined = startDate && endDate
    ? { from: startDate, to: endDate }
    : startDate
    ? { from: startDate, to: undefined }
    : undefined;

  const handleDayClick = (day: Date) => {
    // Respect the same disabled logic the calendar uses
    if (disabled(day)) return;

    // Treat the two inputs as two separate "editing modes":
    // - When editing start: always update start (never "locks" to the previous start)
    // - When editing end: update end, and close once both dates are set
    if (activeField === "start") {
      const nextStart = day;
      const nextEnd = endDate && endDate < nextStart ? null : endDate;
      onDateChange(nextStart, nextEnd);
      return;
    }

    // activeField === "end"
    if (!startDate) {
      // If user starts with the end field, treat first click as setting start.
      onDateChange(day, null);
      return;
    }

    if (day < startDate) {
      // If they pick an end date earlier than start, treat it as a new start.
      onDateChange(day, null);
      return;
    }

    onDateChange(startDate, day);
    setOpen(false);
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
            onClick={() => {
              setActiveField("start");
            }}
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

        {/* Not a PopoverTrigger on purpose: switching fields shouldn't toggle/close the popover. */}
        <Button
          variant="outline"
          onClick={() => {
            setActiveField("end");
            setOpen(true);
          }}
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
      </div>
      
      <PopoverContent className="w-auto p-0 bg-card border-border-subtle" align="start">
        <Calendar
          mode="range"
          selected={dateRange}
          onDayClick={(day) => handleDayClick(day)}
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
