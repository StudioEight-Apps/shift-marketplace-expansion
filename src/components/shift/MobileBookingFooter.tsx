import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useTrip } from "@/context/TripContext";
import { cn } from "@/lib/utils";
import type { Listing } from "./ListingCard";

interface MobileBookingFooterProps {
  listing: Listing;
  priceUnit: string;
  hasValidBooking: boolean;
  onViewDates: () => void;
}

const MobileBookingFooter = ({
  listing,
  priceUnit,
  hasValidBooking,
  onViewDates,
}: MobileBookingFooterProps) => {
  const { car, yachtBooking, stayNights, carDays, yachtHours, tripTotal } = useTrip();

  const isStay = listing.assetType === "Stays";
  
  // Count added items (for stays only)
  const addOnCount = useMemo(() => {
    if (!isStay) return 0;
    let count = 0;
    if (car) count++;
    if (yachtBooking.yacht) count++;
    return count;
  }, [car, yachtBooking.yacht, isStay]);

  // Total item count including the stay
  const totalItems = isStay ? 1 + addOnCount : 1;

  // Calculate display price - for stays show per-night, otherwise per unit
  const displayPrice = isStay && stayNights > 0 
    ? Math.round(tripTotal / stayNights) 
    : listing.price;

  // Button text changes based on state
  const getButtonText = () => {
    if (hasValidBooking && addOnCount > 0) {
      return "Review Trip";
    }
    if (hasValidBooking) {
      return "Request to Book";
    }
    return "View Dates";
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-card border-t border-border-subtle rounded-t-2xl px-4 py-3 flex items-center justify-between h-[80px] safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        {/* Price Section */}
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-primary">
              ${displayPrice.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">/ {priceUnit}</span>
          </div>
          {addOnCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {totalItems} items in trip
            </span>
          )}
        </div>

        {/* CTA Button */}
        <div className="relative">
          <Button
            onClick={onViewDates}
            className={cn(
              "font-semibold px-6 h-12 text-base rounded-full transition-all duration-200",
              "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
          >
            {getButtonText()}
          </Button>
          
          {/* Badge indicator for add-ons */}
          {addOnCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
              {addOnCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileBookingFooter;
