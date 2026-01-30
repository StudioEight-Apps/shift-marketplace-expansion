import { useMemo, useState } from "react";
import { differenceInDays, format } from "date-fns";
import { X, Car, Anchor, Home } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useTrip } from "@/context/TripContext";
import { useAuth } from "@/context/AuthContext";
import DateRangePicker from "./DateRangePicker";
import YachtDatePicker from "./YachtDatePicker";
import AuthModal from "./AuthModal";
import BookingConfirmation from "./BookingConfirmation";
import type { Listing } from "./ListingCard";

interface MobileBookingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  priceUnit: string;
  dateLabels: { start: string; end: string };
  // For Stays/Cars
  currentDates?: { start: Date | null; end: Date | null };
  onDateChange?: (start: Date | null, end: Date | null) => void;
  // For Yachts
  yachtDate?: Date | null;
  yachtHours?: number | null;
  onYachtDateChange?: (date: Date | null) => void;
  onYachtHoursChange?: (hours: number) => void;
  minDate?: Date;
}

const MobileBookingSheet = ({
  isOpen,
  onClose,
  listing,
  priceUnit,
  dateLabels,
  currentDates,
  onDateChange,
  yachtDate,
  yachtHours,
  onYachtDateChange,
  onYachtHoursChange,
  minDate,
}: MobileBookingSheetProps) => {
  const {
    car,
    carDays,
    carDates,
    removeCar,
    yachtBooking,
    yachtHours: tripYachtHours,
    yachtTotal,
    removeYacht,
    stayNights,
    stayTotal,
    carTotal,
    tripTotal,
  } = useTrip();
  const { user, addBookingRequest } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    requestId: string;
    destination: string;
    checkIn: Date;
    checkOut: Date;
    items: { type: string; name: string; price: number }[];
    total: number;
  } | null>(null);

  const isStay = listing.assetType === "Stays";
  const isYacht = listing.assetType === "Yachts";

  // Calculate duration and totals for non-yacht bookings
  const duration = useMemo(() => {
    if (isYacht) return 0;
    if (!currentDates?.start || !currentDates?.end) return 0;
    return Math.max(0, differenceInDays(currentDates.end, currentDates.start));
  }, [currentDates, isYacht]);

  const primaryTotal = useMemo(() => {
    if (isYacht) {
      return (yachtHours || 0) * listing.price;
    }
    return listing.price * duration;
  }, [listing.price, duration, isYacht, yachtHours]);

  // Check if we have add-ons (only for Stays)
  const hasCarAddOn = car && isStay && carDays > 0;
  const hasYachtAddOn = yachtBooking.yacht && isStay && tripYachtHours > 0;
  const grandTotal = isStay ? tripTotal : primaryTotal;

  // Validation
  const isValidBooking = isYacht
    ? yachtDate && yachtHours && yachtHours > 0
    : currentDates?.start && currentDates?.end && duration > 0;

  const durationLabel = isYacht
    ? `${yachtHours} ${yachtHours === 1 ? "hour" : "hours"}`
    : `${duration} ${duration === 1 ? priceUnit : priceUnit + "s"}`;

  // Format car dates for display
  const getCarDatesLabel = () => {
    if (!carDates.pickup || !carDates.dropoff) return "";
    return `${format(carDates.pickup, "MMM d")} – ${format(carDates.dropoff, "MMM d")}`;
  };

  // Format yacht booking for display
  const getYachtLabel = () => {
    if (!yachtBooking.startDate) return "";
    return `${format(yachtBooking.startDate, "MMM d")} · ${yachtBooking.startTime}–${yachtBooking.endTime}`;
  };

  const handleBookingSubmit = () => {
    const checkIn = isYacht ? yachtDate : currentDates?.start;
    const checkOut = isYacht
      ? (() => {
          const out = new Date(yachtDate!);
          out.setHours(out.getHours() + (yachtHours || 0));
          return out;
        })()
      : currentDates?.end;

    if (!checkIn || !checkOut) return;

    // Build items list
    const items: { type: string; name: string; price: number }[] = [
      {
        type: isStay ? "Stay" : isYacht ? "Yacht" : "Car",
        name: listing.title,
        price: isStay ? stayTotal : primaryTotal,
      },
    ];

    if (hasCarAddOn && car) {
      items.push({ type: "Car", name: car.title, price: carTotal });
    }
    if (hasYachtAddOn && yachtBooking.yacht) {
      items.push({ type: "Yacht", name: yachtBooking.yacht.title, price: yachtTotal });
    }

    const requestId = addBookingRequest({
      destination: listing.location,
      checkIn,
      checkOut,
      items,
      total: grandTotal,
    });

    setConfirmationData({
      requestId,
      destination: listing.location,
      checkIn,
      checkOut,
      items,
      total: grandTotal,
    });
    setShowConfirmation(true);
    onClose();
  };

  const handleRequestToBook = () => {
    if (!user) {
      onClose();
      setShowAuthModal(true);
    } else {
      handleBookingSubmit();
    }
  };

  const handleAuthSuccess = () => {
    handleBookingSubmit();
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left border-b border-border-subtle pb-4">
            <DrawerTitle className="text-lg font-semibold">
              {isStay && (hasCarAddOn || hasYachtAddOn) ? "Your Trip" : listing.title}
            </DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-6 space-y-4 overflow-y-auto">
            {/* Date Selector - Only show if no add-ons or not a stay */}
            {(!isStay || (!hasCarAddOn && !hasYachtAddOn)) && (
              <div className="pt-4">
                <h3 className="text-sm font-medium text-foreground mb-3">
                  {isYacht ? "Select Date & Duration" : "Select Dates"}
                </h3>
                {isYacht ? (
                  <YachtDatePicker
                    selectedDate={yachtDate ?? null}
                    selectedHours={yachtHours ?? null}
                    onDateChange={onYachtDateChange || (() => {})}
                    onHoursChange={onYachtHoursChange || (() => {})}
                    minDate={minDate}
                  />
                ) : (
                  <DateRangePicker
                    startDate={currentDates?.start ?? null}
                    endDate={currentDates?.end ?? null}
                    onDateChange={onDateChange || (() => {})}
                    startLabel={dateLabels.start}
                    endLabel={dateLabels.end}
                    minDate={minDate}
                  />
                )}
              </div>
            )}

            {/* Trip Summary for Stays with add-ons */}
            {isStay && isValidBooking && (
              <div className="space-y-3 pt-4">
                {/* Villa/Stay Item */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30">
                  <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={listing.image}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Home className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Stay</span>
                    </div>
                    <h4 className="text-sm font-medium text-foreground line-clamp-1">
                      {listing.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {currentDates?.start && currentDates?.end && (
                        <>
                          {format(currentDates.start, "MMM d")} – {format(currentDates.end, "MMM d")} ·{" "}
                        </>
                      )}
                      {stayNights} {stayNights === 1 ? "night" : "nights"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-foreground">
                      ${stayTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Car Add-on */}
                {hasCarAddOn && car && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30">
                    <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={car.image}
                        alt={car.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Car className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Car</span>
                      </div>
                      <h4 className="text-sm font-medium text-foreground line-clamp-1">
                        {car.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {getCarDatesLabel()} · {carDays} {carDays === 1 ? "day" : "days"}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        ${carTotal.toLocaleString()}
                      </span>
                      <button
                        onClick={removeCar}
                        className="p-1 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Yacht Add-on */}
                {hasYachtAddOn && yachtBooking.yacht && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30">
                    <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={yachtBooking.yacht.image}
                        alt={yachtBooking.yacht.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Anchor className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Yacht</span>
                      </div>
                      <h4 className="text-sm font-medium text-foreground line-clamp-1">
                        {yachtBooking.yacht.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {getYachtLabel()} · {tripYachtHours}{" "}
                        {tripYachtHours === 1 ? "hour" : "hours"}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        ${yachtTotal.toLocaleString()}
                      </span>
                      <button
                        onClick={removeYacht}
                        className="p-1 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                  <span className="text-base font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    ${grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Simple Summary for non-stays or stays without add-ons */}
            {!isStay && isValidBooking && (
              <div className="space-y-3 pt-4 border-t border-border-subtle">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    ${listing.price.toLocaleString()} × {durationLabel}
                  </span>
                  <span className="text-foreground font-medium">
                    ${primaryTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                  <span className="text-base font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    ${primaryTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* CTA */}
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base rounded-full"
              size="lg"
              disabled={!isValidBooking}
              onClick={handleRequestToBook}
            >
              Request to Book
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              No charge yet. A representative will confirm availability.
            </p>
          </div>
        </DrawerContent>
      </Drawer>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        defaultTab="login"
      />

      {confirmationData && (
        <BookingConfirmation
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          {...confirmationData}
        />
      )}
    </>
  );
};

export default MobileBookingSheet;