import { useMemo } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import YachtDatePicker from "./YachtDatePicker";
import type { Listing } from "./ListingCard";

interface YachtBookingCardProps {
  listing: Listing;
  selectedDate: Date | null;
  selectedHours: number | null;
  onDateChange: (date: Date | null) => void;
  onHoursChange: (hours: number) => void;
  minDate?: Date;
}

const YachtBookingCard = ({
  listing,
  selectedDate,
  selectedHours,
  onDateChange,
  onHoursChange,
  minDate,
}: YachtBookingCardProps) => {
  const total = useMemo(() => {
    if (!selectedHours) return 0;
    return listing.price * selectedHours;
  }, [listing.price, selectedHours]);

  const isValidBooking = selectedDate && selectedHours && selectedHours > 0;

  return (
    <div className="rounded-2xl bg-card border border-border-subtle p-6 space-y-5">
      {/* Price */}
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-primary">${listing.price.toLocaleString()}</span>
        <span className="text-muted-foreground">/ hour</span>
      </div>

      {/* Date & Hour Selector */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Select Date &amp; Duration</h3>
        <YachtDatePicker
          selectedDate={selectedDate}
          selectedHours={selectedHours}
          onDateChange={onDateChange}
          onHoursChange={onHoursChange}
          minDate={minDate}
        />
      </div>

      {/* Summary */}
      {isValidBooking && (
        <div className="space-y-3 pt-2 border-t border-border-subtle">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {format(selectedDate!, "MMM d, yyyy")} · {selectedHours} hrs
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              ${listing.price.toLocaleString()} × {selectedHours} hours
            </span>
            <span className="text-foreground font-medium">${total.toLocaleString()}</span>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
            <span className="text-base font-semibold text-foreground">Total</span>
            <span className="text-xl font-bold text-primary">${total.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* CTA */}
      <Button
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base"
        size="lg"
        disabled={!isValidBooking}
      >
        Request to Book
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        No charge yet. A representative will confirm availability.
      </p>
    </div>
  );
};

export default YachtBookingCard;
