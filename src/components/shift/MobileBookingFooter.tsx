import { Button } from "@/components/ui/button";
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
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-card border-t border-border-subtle px-4 py-3 flex items-center justify-between h-[60px] safe-area-bottom">
        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-primary">
            ${listing.price.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">/ {priceUnit}</span>
        </div>

        {/* CTA Button */}
        <Button
          onClick={onViewDates}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
        >
          {hasValidBooking ? "Request to Book" : "View Dates"}
        </Button>
      </div>
    </div>
  );
};

export default MobileBookingFooter;
