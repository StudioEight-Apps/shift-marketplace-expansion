import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BookingVilla, BookingCar, BookingYacht } from "@/context/AuthContext";

interface BookingConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  villa: BookingVilla | null;
  car: BookingCar | null;
  yacht: BookingYacht | null;
  grandTotal: number;
}

const BookingConfirmation = ({
  isOpen,
  onClose,
  requestId,
  villa,
  car,
  yacht,
  grandTotal,
}: BookingConfirmationProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleViewTrips = () => {
    onClose();
    navigate("/trips");
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get primary destination/location
  const destination = villa?.location || "Your Trip";

  // Get date range
  const getDateRange = () => {
    if (villa) {
      return `${formatDate(villa.checkIn)} - ${formatDate(villa.checkOut)}`;
    }
    if (car) {
      return `${formatDate(car.pickupDate)} - ${formatDate(car.dropoffDate)}`;
    }
    if (yacht) {
      return formatDate(yacht.date);
    }
    return "";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-md mx-4 rounded-xl bg-card border border-border-subtle p-8 shadow-xl text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Request Submitted!
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          We'll contact you shortly to confirm your booking.
        </p>

        {/* Request ID */}
        <div className="bg-background rounded-lg px-4 py-3 mb-6">
          <span className="text-xs text-muted-foreground">Request ID</span>
          <p className="text-sm font-mono font-medium text-foreground truncate">{requestId}</p>
        </div>

        {/* Summary */}
        <div className="border-t border-border-subtle pt-4 mb-6 text-left space-y-3">
          {destination && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Destination</span>
              <span className="text-foreground">{destination}</span>
            </div>
          )}
          {getDateRange() && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dates</span>
              <span className="text-foreground">{getDateRange()}</span>
            </div>
          )}

          {/* Items breakdown */}
          <div className="border-t border-border-subtle pt-3 space-y-2">
            {villa && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Stay: {villa.name} ({villa.nights} {villa.nights === 1 ? "night" : "nights"})
                </span>
                <span className="text-foreground">${villa.price.toLocaleString()}</span>
              </div>
            )}
            {car && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Car: {car.name} ({car.days} {car.days === 1 ? "day" : "days"})
                </span>
                <span className="text-foreground">${car.price.toLocaleString()}</span>
              </div>
            )}
            {yacht && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Yacht: {yacht.name} ({yacht.hours} {yacht.hours === 1 ? "hour" : "hours"})
                </span>
                <span className="text-foreground">${yacht.price.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex justify-between pt-2 border-t border-border-subtle">
            <span className="font-medium text-foreground">Total</span>
            <span className="font-bold text-primary">${grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={handleViewTrips}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-5"
        >
          View My Trips
        </Button>
      </div>
    </div>
  );
};

export default BookingConfirmation;
