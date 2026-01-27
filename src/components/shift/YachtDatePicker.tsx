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

const HOUR_OPTIONS = [4, 6, 8] as const;

interface YachtDatePickerProps {
  selectedDate: Date | null;
  selectedHours: number | null;
  onDateChange: (date: Date | null) => void;
  onHoursChange: (hours: number) => void;
  minDate?: Date;
  className?: string;
}

const YachtDatePicker = ({
  selectedDate,
  selectedHours,
  onDateChange,
  onHoursChange,
  minDate,
  className,
}: YachtDatePickerProps) => {
  const [open, setOpen] = useState(false);

  const disabled = (date: Date) => {
    if (!minDate) return false;
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const minStart = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    return dateStart < minStart;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Date Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-auto py-3 px-4 bg-secondary/30 border-border-subtle hover:bg-secondary/50",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <div className="flex flex-col items-start gap-1 w-full">
              <span className="text-xs text-muted-foreground">Date</span>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Select date"}
                </span>
              </div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-card border-border-subtle" align="start">
          <Calendar
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={(day) => {
              onDateChange(day ?? null);
              setOpen(false);
            }}
            disabled={disabled}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* Hour Blocks */}
      <div>
        <span className="block text-xs text-muted-foreground mb-2">Duration</span>
        <div className="flex gap-2">
          {HOUR_OPTIONS.map((hours) => (
            <Button
              key={hours}
              variant="outline"
              size="sm"
              onClick={() => onHoursChange(hours)}
              className={cn(
                "flex-1 py-2 text-sm font-medium transition-colors",
                selectedHours === hours
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-secondary/30 border-border-subtle text-muted-foreground hover:bg-secondary/50"
              )}
            >
              {hours} hrs
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default YachtDatePicker;
