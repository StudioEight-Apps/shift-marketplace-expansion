import { useEffect } from "react";
import { Star, Users, Bed, MapPin, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTrip } from "@/context/TripContext";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import DateRangePicker from "./DateRangePicker";
import TripBuilder from "./TripBuilder";
import TripSummary from "./TripSummary";
import type { Listing } from "./ListingCard";

interface ListingDetailModalProps {
  listing: Listing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ListingDetailModal = ({ listing, open, onOpenChange }: ListingDetailModalProps) => {
  const isMobile = useIsMobile();
  const { setStay, stayDates, setStayDates, clearTrip } = useTrip();

  // Set the stay in context when modal opens
  useEffect(() => {
    if (open && listing) {
      setStay(listing);
    }
  }, [open, listing, setStay]);

  // Clear trip when modal closes
  const handleClose = () => {
    clearTrip();
    onOpenChange(false);
  };

  if (!listing) return null;

  // Get min date as today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const content = (
    <div className="flex flex-col h-full max-h-[90vh] md:max-h-[85vh]">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={listing.image}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
          
          {/* Badges */}
          <div className="absolute left-4 top-4 flex gap-2">
            {listing.badges.map((badge) => (
              <span
                key={badge}
                className={
                  badge === "Guest Favorite"
                    ? "rounded-full px-3 py-1 text-xs font-medium bg-primary/80 text-primary-foreground backdrop-blur-sm"
                    : "rounded-full px-3 py-1 text-xs font-medium bg-secondary/80 text-foreground backdrop-blur-sm"
                }
              >
                {badge}
              </span>
            ))}
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-x-0 bottom-0 h-24 overlay-gradient" />
        </div>

        {/* Details */}
        <div className="p-6 space-y-6">
          {/* Title and Location */}
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {listing.title}
            </h2>
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {listing.location}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {listing.rating}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-secondary/30 px-4 py-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">{listing.guests}</p>
                <p className="text-xs text-muted-foreground">Guests</p>
              </div>
            </div>
            {listing.bedrooms && (
              <div className="flex items-center gap-2 rounded-lg bg-secondary/30 px-4 py-3">
                <Bed className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{listing.bedrooms}</p>
                  <p className="text-xs text-muted-foreground">Bedrooms</p>
                </div>
              </div>
            )}
          </div>

          {/* Amenities */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Highlights</h3>
            <div className="flex flex-wrap gap-2">
              {listing.attributes.map((attr, index) => (
                <span
                  key={index}
                  className="rounded-full bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground"
                >
                  {attr}
                </span>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-primary">${listing.price}</span>
            <span className="text-muted-foreground">/ night</span>
          </div>

          {/* Date Selection */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Select Dates</h3>
            <DateRangePicker
              startDate={stayDates.checkIn}
              endDate={stayDates.checkOut}
              onDateChange={(checkIn, checkOut) => setStayDates({ checkIn, checkOut })}
              minDate={today}
            />
          </div>

          {/* Trip Builder (Car Selection) */}
          {listing.assetType === "Stays" && (
            <TripBuilder />
          )}
        </div>
      </div>

      {/* Sticky Footer */}
      <TripSummary />
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent 
          side="bottom" 
          className="h-[95vh] p-0 rounded-t-2xl bg-card border-border-subtle"
        >
          <SheetTitle className="sr-only">{listing.title}</SheetTitle>
          {/* Custom Close Button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-background/80 p-2 backdrop-blur-sm hover:bg-background transition-colors"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl p-0 bg-card border-border-subtle overflow-hidden">
        <DialogTitle className="sr-only">{listing.title}</DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default ListingDetailModal;
