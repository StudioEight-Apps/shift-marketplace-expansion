import { useMemo, useState } from "react";
import { differenceInDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useTrip } from "@/context/TripContext";
import { useAuth, BookingRequestInput, BookingVilla, BookingCar, BookingYacht } from "@/context/AuthContext";
import DateRangePicker from "./DateRangePicker";
import AuthModal from "./AuthModal";
import BookingConfirmation from "./BookingConfirmation";
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
  const { user, addBookingRequest } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    requestId: string;
    villa: BookingVilla | null;
    car: BookingCar | null;
    yacht: BookingYacht | null;
    grandTotal: number;
  } | null>(null);

  const isStay = listing.assetType === "Stays";

  // Calculate duration and totals
  const duration = useMemo(() => {
    if (!currentDates.start || !currentDates.end) return 0;
    return Math.max(0, differenceInDays(currentDates.end, currentDates.start));
  }, [currentDates]);

  const primaryTotal = useMemo(() => {
    return listing.price * duration;
  }, [listing.price, duration]);

  const cleaningFee = listing.cleaningFee || 0;

  // Check if we have add-ons from "Complete Your Trip" (only for Stays)
  const hasCarAddOn = car && isStay && carDays > 0;
  const hasYachtAddOn = yachtBooking.yacht && isStay && yachtHours > 0;
  const carAddOnTotal = hasCarAddOn ? car.price * carDays : 0;
  const stayCleaningFee = isStay && duration > 0 ? cleaningFee : 0;
  const grandTotal = isStay ? tripTotal + stayCleaningFee : primaryTotal;

  // For standalone bookings (cars/yachts), require dates; for stays, same logic
  const isValidBooking = currentDates.start && currentDates.end && duration > 0;

  const durationLabel = `${duration} ${duration === 1 ? priceUnit : priceUnit + "s"}`;

  // Format car dates for display
  const getCarDatesLabel = () => {
    if (!carDates.pickup || !carDates.dropoff) return "";
    return `${format(carDates.pickup, "MMM d")} – ${format(carDates.dropoff, "MMM d")}`;
  };

  // Convert 24h time to 12h AM/PM
  const to12Hour = (time: string | null) => {
    if (!time) return "";
    if (time.includes("AM") || time.includes("PM")) return time;
    const [h] = time.split(":").map(Number);
    if (h === 0) return "12:00 AM";
    if (h === 12) return "12:00 PM";
    return h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`;
  };

  // Format yacht booking for display
  const getYachtLabel = () => {
    if (!yachtBooking.startDate) return "";
    return `${format(yachtBooking.startDate, "MMM d")} · ${to12Hour(yachtBooking.startTime)}–${to12Hour(yachtBooking.endTime)}`;
  };

  const handleBookingSubmit = async () => {
    if (!currentDates.start || !currentDates.end) return;

    setIsSubmitting(true);

    try {
      // Build villa data (for stays) or null
      const villaData: BookingVilla | null = isStay ? {
        name: listing.title,
        checkIn: currentDates.start,
        checkOut: currentDates.end,
        price: primaryTotal,
        pricePerNight: listing.price,
        nights: duration,
        location: listing.location,
      } : null;

      // Build car data if added
      const carData: BookingCar | null = hasCarAddOn && car && carDates.pickup && carDates.dropoff ? {
        name: car.title,
        pickupDate: carDates.pickup,
        dropoffDate: carDates.dropoff,
        price: carAddOnTotal,
        pricePerDay: car.price,
        days: carDays,
      } : null;

      // Build yacht data if added
      const yachtData: BookingYacht | null = hasYachtAddOn && yachtBooking.yacht && yachtBooking.startDate ? {
        name: yachtBooking.yacht.title,
        date: yachtBooking.startDate,
        startTime: yachtBooking.startTime,
        endTime: yachtBooking.endTime,
        price: yachtTotal,
        pricePerHour: yachtBooking.yacht.price,
        hours: yachtHours,
      } : null;

      // For non-stay bookings (standalone car or yacht)
      let finalVilla = villaData;
      let finalCar = carData;
      let finalYacht = yachtData;

      if (listing.assetType === "Cars") {
        finalCar = {
          name: listing.title,
          pickupDate: currentDates.start,
          dropoffDate: currentDates.end,
          price: primaryTotal,
          pricePerDay: listing.price,
          days: duration,
        };
      } else if (listing.assetType === "Yachts") {
        const yachtEnd24 = 10 + duration;
        const yachtEnd12 = yachtEnd24 > 12 ? yachtEnd24 - 12 : yachtEnd24;
        const yachtEndAmPm = yachtEnd24 >= 12 ? "PM" : "AM";
        finalYacht = {
          name: listing.title,
          date: currentDates.start,
          startTime: "10:00 AM",
          endTime: `${yachtEnd12}:00 ${yachtEndAmPm}`,
          price: primaryTotal,
          pricePerHour: listing.price,
          hours: duration,
        };
      }

      const bookingInput: BookingRequestInput = {
        villa: finalVilla,
        car: finalCar,
        yacht: finalYacht,
        grandTotal,
      };

      const requestId = await addBookingRequest(bookingInput);

      setConfirmationData({
        requestId,
        villa: finalVilla,
        car: finalCar,
        yacht: finalYacht,
        grandTotal,
      });
      setShowConfirmation(true);
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to submit booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestToBook = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      handleBookingSubmit();
    }
  };

  const handleAuthSuccess = () => {
    // After successful login, proceed with booking
    handleBookingSubmit();
  };

  return (
    <>
      <div className="rounded-2xl bg-card border border-border-subtle p-6 space-y-5">
        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-primary">${listing.price.toLocaleString()}</span>
          <span className="text-muted-foreground">/ {priceUnit}</span>
        </div>

        {/* Date Selector - All asset types get independent calendars */}
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

            {/* Cleaning Fee (villas only) */}
            {isStay && cleaningFee > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cleaning fee</span>
                <span className="text-foreground font-medium">
                  ${cleaningFee.toLocaleString()}
                </span>
              </div>
            )}

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

            {/* Deposit notice */}
            {listing.depositAmount > 0 && (
              <div className="flex items-center justify-between text-sm bg-primary/5 rounded-lg px-3 py-2">
                <span className="text-muted-foreground text-xs">Deposit due once confirmed</span>
                <span className="text-primary font-semibold text-sm">
                  ${listing.depositAmount.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base"
          size="lg"
          disabled={!isValidBooking || isSubmitting}
          onClick={handleRequestToBook}
        >
          {isSubmitting ? "Submitting..." : "Request to Book"}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          No charge yet. A representative will confirm availability.
        </p>
      </div>

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

export default BookingCard;
