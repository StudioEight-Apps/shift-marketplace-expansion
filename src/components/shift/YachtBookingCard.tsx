import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useAuth, BookingRequestInput, BookingYacht, GuestInfo } from "@/context/AuthContext";
import { notifyBooking } from "@/lib/notify";
import YachtDatePicker from "./YachtDatePicker";
import AuthModal from "./AuthModal";
import BookingConfirmation from "./BookingConfirmation";
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
  const { user, addBookingRequest } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    requestId: string;
    villa: null;
    car: null;
    yacht: BookingYacht;
    grandTotal: number;
  } | null>(null);

  const total = useMemo(() => {
    if (!selectedHours) return 0;
    return listing.price * selectedHours;
  }, [listing.price, selectedHours]);

  const isValidBooking = selectedDate && selectedHours && selectedHours > 0;

  const handleBookingSubmit = async (guestInfo?: GuestInfo) => {
    if (!selectedDate || !selectedHours) return;

    setIsSubmitting(true);

    try {
      const endHour24 = 10 + selectedHours;
      const endHour12 = endHour24 > 12 ? endHour24 - 12 : endHour24;
      const endAmPm = endHour24 >= 12 ? "PM" : "AM";

      const yachtData: BookingYacht = {
        id: listing.id,
        name: listing.title,
        image: listing.image || listing.images?.[0] || "",
        location: listing.location,
        date: selectedDate,
        startTime: "10:00 AM",
        endTime: `${endHour12}:00 ${endAmPm}`,
        price: total,
        pricePerHour: listing.price,
        hours: selectedHours,
      };

      const bookingInput: BookingRequestInput = {
        villa: null,
        car: null,
        yacht: yachtData,
        grandTotal: total,
        ...(guestInfo ? { guestInfo } : {}),
      };

      const requestId = await addBookingRequest(bookingInput);

      // Fire-and-forget email notification
      const customer = guestInfo
        ? { uid: "guest", name: `${guestInfo.firstName} ${guestInfo.lastName}`.trim(), email: guestInfo.email, phone: guestInfo.phone }
        : { uid: user!.uid, name: `${user!.displayName || ""}`.trim() || "Registered User", email: user!.email || "", phone: "" };
      notifyBooking({ customer, villa: null, car: null, yacht: yachtData, grandTotal: total, requestId });

      setConfirmationData({
        requestId,
        villa: null,
        car: null,
        yacht: yachtData,
        grandTotal: total,
      });
      setShowConfirmation(true);
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to submit booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [pendingBooking, setPendingBooking] = useState(false);

  useEffect(() => {
    if (pendingBooking && user) {
      setPendingBooking(false);
      handleBookingSubmit();
    }
  }, [pendingBooking, user]);

  const handleRequestToBook = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      handleBookingSubmit();
    }
  };

  const handleAuthSuccess = () => {
    setPendingBooking(true);
  };

  const handleGuestSubmit = (guestInfo: GuestInfo) => {
    handleBookingSubmit(guestInfo);
  };

  return (
    <>
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
        onGuestSubmit={handleGuestSubmit}
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

export default YachtBookingCard;
