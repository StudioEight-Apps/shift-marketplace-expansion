import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface BookingItem {
  type: string;
  name: string;
  price: number;
}

interface BookingConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  destination: string;
  checkIn: Date;
  checkOut: Date;
  items: BookingItem[];
  total: number;
}

const BookingConfirmation = ({
  isOpen,
  onClose,
  requestId,
  destination,
  checkIn,
  checkOut,
  items,
  total,
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
          Request Submitted Successfully
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          A member of our team will reach out via call/text shortly to confirm your booking
        </p>

        {/* Request ID */}
        <div className="bg-background rounded-lg px-4 py-3 mb-6">
          <span className="text-xs text-muted-foreground">Request ID</span>
          <p className="text-base font-mono font-medium text-foreground">{requestId}</p>
        </div>

        {/* Summary */}
        <div className="border-t border-border-subtle pt-4 mb-6 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Destination</span>
            <span className="text-foreground">{destination}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Dates</span>
            <span className="text-foreground">
              {formatDate(checkIn)} - {formatDate(checkOut)}
            </span>
          </div>
          <div className="border-t border-border-subtle pt-3">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm py-1">
                <span className="text-muted-foreground">{item.type}: {item.name}</span>
                <span className="text-foreground">${item.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-2 border-t border-border-subtle">
            <span className="font-medium text-foreground">Total</span>
            <span className="font-bold text-primary">${total.toLocaleString()}</span>
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
