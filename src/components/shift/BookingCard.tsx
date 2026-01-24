import { useMemo } from "react";
import { differenceInDays, differenceInHours } from "date-fns";
import { Button } from "@/components/ui/button";
import { useTrip } from "@/context/TripContext";
import DateRangePicker from "./DateRangePicker";
import type { Listing } from "./ListingCard";

interface BookingCardProps {
  listing: Listing;
  priceUnit: string;
  dateLabels: { start: string; end: string };
  currentDates: { start: Date | null; end: Date | null };
  onDateChange: (start: Date | null, end: Date | null) => void;
  minDate?: Date;
}

const BookingCard = ({
  listing,
  priceUnit,
  dateLabels,
  currentDates,
  onDateChange,
  minDate,
}: BookingCardProps) => {
  const { car, stayNights, carDays, tripTotal } = useTrip();

  // Calculate duration and totals
  const duration = useMemo(() => {
    if (!currentDates.start || !currentDates.end) return 0;
    
    if (listing.assetType === "Yachts") {
      return Math.max(0, differenceInHours(currentDates.end, currentDates.start));
    }
    return Math.max(0, differenceInDays(currentDates.end, currentDates.start));
  }, [currentDates, listing.assetType]);

  const primaryTotal = useMemo(() => {
    return listing.price * duration;
  }, [listing.price, duration]);

  // Check if we have add-ons from "Complete Your Trip"
  const hasAddOns = car && listing.assetType === "Stays";
  const addOnTotal = hasAddOns && carDays > 0 ? car.price * carDays : 0;
  const grandTotal = listing.assetType === "Stays" ? tripTotal : primaryTotal;

  const isValidBooking = currentDates.start && currentDates.end && duration > 0;

  const durationLabel = listing.assetType === "Yachts" 
    ? `${duration} ${duration === 1 ? "hour" : "hours"}`
    : `${duration} ${duration === 1 ? priceUnit : priceUnit + "s"}`;

  return (
    <div className="rounded-2xl bg-card border border-border-subtle p-6 space-y-6">
      {/* Price */}
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-primary">${listing.price.toLocaleString()}</span>
        <span className="text-muted-foreground">/ {priceUnit}</span>
      </div>

      {/* Date Selector */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Select Dates</h3>
        <DateRangePicker
          startDate={currentDates.start}
          endDate={currentDates.end}
          onDateChange={onDateChange}
          startLabel={dateLabels.start}
          endLabel={dateLabels.end}
          minDate={minDate}
        />
      </div>

      {/* Summary */}
      {isValidBooking && (
        <div className="space-y-3 pt-2 border-t border-border-subtle">
          {/* Primary item */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              ${listing.price.toLocaleString()} × {durationLabel}
            </span>
            <span className="text-foreground font-medium">
              ${primaryTotal.toLocaleString()}
            </span>
          </div>

          {/* Add-ons from Complete Your Trip */}
          {hasAddOns && carDays > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {car.title} · {carDays} {carDays === 1 ? "day" : "days"}
              </span>
              <span className="text-foreground font-medium">
                ${addOnTotal.toLocaleString()}
              </span>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
            <span className="text-base font-semibold text-foreground">Total</span>
            <span className="text-xl font-bold text-primary">
              ${grandTotal.toLocaleString()}
            </span>
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

export default BookingCard;
