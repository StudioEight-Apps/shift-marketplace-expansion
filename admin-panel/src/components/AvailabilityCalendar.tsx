import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, X, Calendar, Lock, RefreshCw } from "lucide-react";

interface AvailabilityCalendarProps {
  itemName: string;
  itemType: "villa" | "car" | "yacht";
  blockedDates: string[]; // Simple string array from Firestore
  readOnlyCalendar?: boolean; // true for PMS/API sources, defaults to false
  syncStatus?: "n/a" | "ok" | "stale" | "error";
  lastSyncedAt?: string | null; // ISO timestamp
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
  // Debug log to verify component mounts
  console.log("AvailabilityCalendar rendering:", { itemName, itemType, blockedDates, readOnlyCalendar });

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"view" | "block" | "unblock">("view");

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get day of week for first day (0 = Sunday)
  const startDayOfWeek = monthStart.getDay();

  // Create padding for days before month starts
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-white">{itemName}</h2>
              <p className="text-xs text-gray-400 capitalize">{itemType} Availability</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Source Info */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isReadOnly ? (
                <>
                  <Lock className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-blue-400">External API (Read Only)</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-purple-400">Shift Fleet (Editable)</span>
                </>
              )}
            </div>
            {lastSyncedAt && (
              <span className="text-xs text-gray-500">Last synced: {format(new Date(lastSyncedAt), "MMM d, h:mm a")}</span>
            )}
          </div>
        </div>

        {/* Mode Selection */}
        {!isReadOnly && (
          <div className="px-4 py-3 border-b border-border">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMode("view");
                  setSelectedDates(new Set());
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === "view" ? "bg-primary text-black" : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                View
              </button>
              <button
                onClick={() => {
                  setMode("block");
                  setSelectedDates(new Set());
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === "block" ? "bg-red-500 text-white" : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                Block Dates
              </button>
              <button
                onClick={() => {
                  setMode("unblock");
                  setSelectedDates(new Set());
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === "unblock" ? "bg-green-500 text-white" : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                Unblock Dates
              </button>
            </div>
            {mode !== "view" && (
              <p className="text-xs text-gray-500 mt-2">
                {mode === "block" ? "Click dates to block them" : "Click blocked dates to unblock them"}
              </p>
            )}
          </div>
        )}

        {/* Calendar */}
        <div className="p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-400" />
            </button>
            <h3 className="text-white font-medium">{format(currentMonth, "MMMM yyyy")}</h3>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs text-gray-500 py-2">
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
                  className={`
                    aspect-square flex items-center justify-center text-sm rounded-lg transition-colors
                    ${isPast ? "text-gray-600 cursor-not-allowed" : ""}
                    ${isBlocked && !isSelected ? "bg-red-500/30 text-red-400" : ""}
                    ${isSelected ? "bg-primary text-black ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}
                    ${!isBlocked && !isSelected && !isPast ? "text-white hover:bg-white/10" : ""}
                    ${canSelect ? "cursor-pointer" : mode !== "view" ? "cursor-not-allowed opacity-50" : "cursor-default"}
                  `}
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
              <div className="w-3 h-3 rounded bg-red-500/30" />
              <span className="text-gray-400">Blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-white/10" />
              <span className="text-gray-400">Available</span>
            </div>
            {mode !== "view" && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary" />
                <span className="text-gray-400">Selected</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {mode !== "view" && selectedDates.size > 0 && (
          <div className="px-4 pb-4">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedDates(new Set());
                  setMode("view");
                }}
                className="flex-1 px-4 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  mode === "block" ? "bg-red-500 text-white hover:bg-red-600" : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                {mode === "block" ? `Block ${selectedDates.size} Date${selectedDates.size > 1 ? "s" : ""}` : `Unblock ${selectedDates.size} Date${selectedDates.size > 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
