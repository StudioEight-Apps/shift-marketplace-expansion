import { useTrip } from "@/context/TripContext";
import { Button } from "@/components/ui/button";

const TripSummary = () => {
  const {
    stay,
    stayDates,
    car,
    carDates,
    stayNights,
    carDays,
    stayTotal,
    carTotal,
    tripTotal,
  } = useTrip();

  const isValidBooking = stay && stayDates.checkIn && stayDates.checkOut && stayNights > 0;
  const hasValidCar = car && carDates.pickup && carDates.dropoff && carDays > 0;

  if (!isValidBooking) {
    return (
      <div className="border-t border-border-subtle bg-card p-4">
        <p className="text-sm text-muted-foreground text-center">
          Select your dates to see the total
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-border-subtle bg-card p-4 space-y-4">
      {/* Price Breakdown */}
      <div className="space-y-2">
        {/* Stay Line Item */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {stay.title} · {stayNights} {stayNights === 1 ? "night" : "nights"}
          </span>
          <span className="text-foreground font-medium">
            ${stayTotal.toLocaleString()}
          </span>
        </div>

        {/* Car Line Item */}
        {hasValidCar && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {car.title} · {carDays} {carDays === 1 ? "day" : "days"}
            </span>
            <span className="text-foreground font-medium">
              ${carTotal.toLocaleString()}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-border-subtle my-2" />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-foreground">Total</span>
          <span className="text-xl font-bold text-primary">
            ${tripTotal.toLocaleString()}
          </span>
        </div>
      </div>

      {/* CTA Button */}
      <Button
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base"
        size="lg"
      >
        Request to Book
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        You won't be charged yet
      </p>
    </div>
  );
};

export default TripSummary;
