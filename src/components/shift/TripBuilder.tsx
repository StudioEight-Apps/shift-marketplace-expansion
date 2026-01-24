import { Car, X } from "lucide-react";
import { useTrip } from "@/context/TripContext";
import { carListings } from "@/data/listings";
import MiniCarCard from "./MiniCarCard";
import DateRangePicker from "./DateRangePicker";

const TripBuilder = () => {
  const {
    stay,
    stayDates,
    car,
    carDates,
    setCar,
    setCarDates,
    removeCar,
  } = useTrip();

  // Filter cars by the same city as the stay
  const availableCars = carListings.filter(c => c.location === stay?.location);

  // Don't show if no cars available or no stay dates selected
  if (availableCars.length === 0 || !stayDates.checkIn || !stayDates.checkOut) {
    return null;
  }

  const handleCarToggle = (selectedCar: typeof carListings[0]) => {
    if (car?.id === selectedCar.id) {
      removeCar();
    } else {
      setCar(selectedCar);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Car className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">
          Complete Your Trip
        </h3>
        <span className="text-xs text-muted-foreground">Optional</span>
      </div>

      {/* Car Carousel */}
      <div className="relative -mx-6 px-6">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-dark snap-x snap-mandatory">
          {availableCars.map((carOption) => (
            <div key={carOption.id} className="snap-start">
              <MiniCarCard
                car={carOption}
                isSelected={car?.id === carOption.id}
                onToggle={() => handleCarToggle(carOption)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Car Date Selection (when a car is selected) */}
      {car && (
        <div className="rounded-lg bg-secondary/20 border border-border-subtle p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={car.image}
                alt={car.title}
                className="h-12 w-12 rounded-md object-cover"
              />
              <div>
                <h4 className="text-sm font-medium text-foreground">{car.title}</h4>
                <p className="text-xs text-muted-foreground">
                  ${car.price}/day
                </p>
              </div>
            </div>
            <button
              onClick={removeCar}
              className="p-1.5 rounded-full hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">
              When do you need the car? (within your stay dates)
            </p>
            <DateRangePicker
              startDate={carDates.pickup}
              endDate={carDates.dropoff}
              onDateChange={(pickup, dropoff) => setCarDates({ pickup, dropoff })}
              startLabel="Pickup"
              endLabel="Drop-off"
              minDate={stayDates.checkIn || undefined}
              maxDate={stayDates.checkOut || undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TripBuilder;
