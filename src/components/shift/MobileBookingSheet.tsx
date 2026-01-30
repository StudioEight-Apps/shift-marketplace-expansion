import { useMemo, useState } from "react";
import { differenceInDays, format } from "date-fns";
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
  const { car, carDays, carDates, yachtBooking, yachtHours: tripYachtHours, yachtTotal, tripTotal } = useTrip();
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

  // Check if we have add-ons from "Complete Your Trip" (only for Stays)
  const hasCarAddOn = car && isStay && carDays > 0;
  const hasYachtAddOn = yachtBooking.yacht && isStay && tripYachtHours > 0;
  const carAddOnTotal = hasCarAddOn ? car.price * carDays : 0;
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
        price: primaryTotal,
      },
    ];

    if (hasCarAddOn && car) {
      items.push({ type: "Car", name: car.title, price: carAddOnTotal });
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
      onClose(); // Close the sheet first so auth modal is visible
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
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-lg font-semibold">
              {listing.title}
            </DrawerTitle>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-primary">
                ${listing.price.toLocaleString()}
              </span>
              <span className="text-muted-foreground">/ {priceUnit}</span>
            </div>
          </DrawerHeader>

          <div className="px-4 pb-6 space-y-5 overflow-y-auto">
            {/* Date Selector */}
            <div>
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

            {/* Summary */}
            {isValidBooking && (
              <div className="space-y-3 pt-4 border-t border-border-subtle">
                {/* Primary item */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    ${listing.price.toLocaleString()} × {durationLabel}
                  </span>
                  <span className="text-foreground font-medium">
                    ${primaryTotal.toLocaleString()}
                  </span>
                </div>

                {/* Car add-on */}
                {hasCarAddOn && car && (
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

                {/* Yacht add-on */}
                {hasYachtAddOn && yachtBooking.yacht && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">
                        {yachtBooking.yacht.title} · {tripYachtHours}{" "}
                        {tripYachtHours === 1 ? "hour" : "hours"}
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
