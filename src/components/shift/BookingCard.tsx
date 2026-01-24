import { useMemo } from "react";
import { differenceInDays, differenceInHours, format } from "date-fns";
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
  const { car, carDays, carDates, yachtBooking, yachtHours, yachtTotal, tripTotal } = useTrip();

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
  const hasCarAddOn = car && listing.assetType === "Stays" && carDays > 0;
  const hasYachtAddOn = yachtBooking.yacht && listing.assetType === "Stays" && yachtHours > 0;
  const carAddOnTotal = hasCarAddOn ? car.price * carDays : 0;
  const grandTotal = listing.assetType === "Stays" ? tripTotal : primaryTotal;

  const isValidBooking = currentDates.start && currentDates.end && duration > 0;

  const durationLabel = listing.assetType === "Yachts" 
    ? `${duration} ${duration === 1 ? "hour" : "hours"}`
    : `${duration} ${duration === 1 ? priceUnit : priceUnit + "s"}`;

  // Format car dates for display
  const getCarDatesLabel = () => {
    if (!carDates.pickup || !carDates.dropoff) return "";
    return ` (${format(carDates.pickup, "MMM d")} - ${format(carDates.dropoff, "MMM d")})`;
  };

  // Format yacht booking for display
  const getYachtLabel = () => {
    if (!yachtBooking.startDate) return "";
    return ` · ${format(yachtBooking.startDate, "MMM d")} ${yachtBooking.startTime}-${yachtBooking.endTime}`;
  };

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

          {/* Car add-on from Complete Your Trip */}
          {hasCarAddOn && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground">
                  {car.title} · {carDays} {carDays === 1 ? "day" : "days"}
                </span>
                <span className="text-xs text-muted-foreground/70">
                  {getCarDatesLabel()}
                </span>
              </div>
              <span className="text-foreground font-medium">
                ${carAddOnTotal.toLocaleString()}
              </span>
            </div>
          )}

          {/* Yacht add-on from Complete Your Trip */}
          {hasYachtAddOn && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground">
                  {yachtBooking.yacht.title} · {yachtHours} {yachtHours === 1 ? "hour" : "hours"}
                </span>
                <span className="text-xs text-muted-foreground/70">
                  {getYachtLabel()}
                </span>
              </div>
              <span className="text-foreground font-medium">
                ${yachtTotal.toLocaleString()}
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
