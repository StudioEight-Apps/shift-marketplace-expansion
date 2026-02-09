import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, X, Calendar, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AvailabilityCalendarProps {
  itemName: string;
  itemType: "villa" | "car" | "yacht";
  blockedDates: string[];
  readOnlyCalendar?: boolean;
  syncStatus?: "n/a" | "ok" | "stale" | "error";
  lastSyncedAt?: string | null;
  onBlockDates?: (dates: string[]) => void;
  onUnblockDates?: (dates: string[]) => void;
  onClose: () => void;
}

const AvailabilityCalendar = ({
  itemName,
  itemType,
  blockedDates = [],
  readOnlyCalendar = false,
  syncStatus,
  lastSyncedAt,
  onBlockDates,
  onUnblockDates,
  onClose,
}: AvailabilityCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"view" | "block" | "unblock">("view");

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = monthStart.getDay();
  const paddingDays = Array(startDayOfWeek).fill(null);

  const isDateBlocked = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd");
    return Array.isArray(blockedDates) && blockedDates.includes(dateStr);
  };

  const isDateSelected = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd");
    return selectedDates.has(dateStr);
  };

  const toggleDateSelection = (date: Date) => {
    if (mode === "view") return;
    const dateStr = format(date, "yyyy-MM-dd");
    const newSelected = new Set(selectedDates);
    if (newSelected.has(dateStr)) {
      newSelected.delete(dateStr);
    } else {
      newSelected.add(dateStr);
    }
    setSelectedDates(newSelected);
  };

  const handleApply = () => {
    if (selectedDates.size === 0) return;
    const datesArray = Array.from(selectedDates);
    if (mode === "block" && onBlockDates) {
      onBlockDates(datesArray);
    } else if (mode === "unblock" && onUnblockDates) {
      onUnblockDates(datesArray);
    }
    setSelectedDates(new Set());
    setMode("view");
  };

  const isReadOnly = readOnlyCalendar;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">{itemName}</h2>
              <p className="text-xs text-muted-foreground capitalize">{itemType} Availability</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Source Info */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isReadOnly ? (
                <>
                  <Lock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-blue-500">External API (Read Only)</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-purple-500">Shift Fleet (Editable)</span>
                </>
              )}
            </div>
            {lastSyncedAt && (
              <span className="text-xs text-muted-foreground">
                Last synced: {format(new Date(lastSyncedAt), "MMM d, h:mm a")}
              </span>
            )}
          </div>
        </div>

        {/* Mode Selection */}
        {!isReadOnly && (
          <div className="px-4 py-3 border-b border-border">
            <div className="flex gap-2">
              <button
                onClick={() => { setMode("view"); setSelectedDates(new Set()); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  mode === "view"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                View
              </button>
              <button
                onClick={() => { setMode("block"); setSelectedDates(new Set()); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  mode === "block"
                    ? "bg-red-500 text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                Block Dates
              </button>
              <button
                onClick={() => { setMode("unblock"); setSelectedDates(new Set()); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  mode === "unblock"
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                Unblock Dates
              </button>
            </div>
            {mode !== "view" && (
              <p className="text-xs text-muted-foreground mt-2">
                {mode === "block" ? "Click dates to block them" : "Click blocked dates to unblock them"}
              </p>
            )}
          </div>
        )}

        {/* Calendar */}
        <div className="p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-border text-foreground hover:bg-muted"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h3 className="text-foreground font-medium">{format(currentMonth, "MMMM yyyy")}</h3>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-border text-foreground hover:bg-muted"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, i) => (
              <div key={`pad-${i}`} className="aspect-square" />
            ))}
            {daysInMonth.map((day) => {
              const isBlocked = isDateBlocked(day);
              const isSelected = isDateSelected(day);
              const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
              const canSelect =
                mode !== "view" && !isPast && ((mode === "block" && !isBlocked) || (mode === "unblock" && isBlocked));

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => canSelect && toggleDateSelection(day)}
                  disabled={mode === "view" || isPast || (mode === "block" && isBlocked) || (mode === "unblock" && !isBlocked)}
                  className={cn(
                    "aspect-square flex items-center justify-center text-sm rounded-lg transition-colors",
                    isPast && !isBlocked && "text-muted-foreground/40 cursor-not-allowed",
                    isPast && isBlocked && "bg-red-400 text-white font-semibold opacity-60",
                    isBlocked && !isSelected && !isPast && "bg-red-500 text-white font-semibold",
                    isSelected && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-card",
                    !isBlocked && !isSelected && !isPast && "text-foreground hover:bg-accent",
                    canSelect ? "cursor-pointer" : mode !== "view" ? "cursor-not-allowed opacity-50" : "cursor-default"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-muted-foreground">Blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-accent border border-border" />
              <span className="text-muted-foreground">Available</span>
            </div>
            {mode !== "view" && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary" />
                <span className="text-muted-foreground">Selected</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {mode !== "view" && selectedDates.size > 0 && (
          <div className="px-4 pb-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setSelectedDates(new Set()); setMode("view"); }}
              >
                Cancel
              </Button>
              <Button
                className={cn(
                  "flex-1",
                  mode === "block"
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-green-500 text-white hover:bg-green-600"
                )}
                onClick={handleApply}
              >
                {mode === "block"
                  ? `Block ${selectedDates.size} Date${selectedDates.size > 1 ? "s" : ""}`
                  : `Unblock ${selectedDates.size} Date${selectedDates.size > 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
