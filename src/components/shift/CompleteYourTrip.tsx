import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTrip } from "@/context/TripContext";
import { villaListings, carListings, yachtListings } from "@/data/listings";
import AddOnCard from "./AddOnCard";
import type { Listing } from "./ListingCard";

interface CompleteYourTripProps {
  currentListing: Listing;
  city: string;
}

const CompleteYourTrip = ({ currentListing, city }: CompleteYourTripProps) => {
  const navigate = useNavigate();
  const { 
    car, setCar, removeCar, 
    carDates, setCarDates,
    yachtBooking, setYacht, setYachtBooking, removeYacht,
    stayDates 
  } = useTrip();

  // Determine which asset types to show based on current listing
  const complementaryListings = useMemo(() => {
    const results: { type: "Cars" | "Yachts" | "Stays"; items: Listing[] }[] = [];

    if (currentListing.assetType === "Stays") {
      // Show Cars and Yachts
      const cars = carListings.filter(c => c.location === city).slice(0, 6);
      const yachts = yachtListings.filter(y => y.location === city).slice(0, 4);
      if (cars.length > 0) results.push({ type: "Cars", items: cars });
      if (yachts.length > 0) results.push({ type: "Yachts", items: yachts });
    } else if (currentListing.assetType === "Cars") {
      // Show Stays and Yachts
      const stays = villaListings.filter(v => v.location === city).slice(0, 4);
      const yachts = yachtListings.filter(y => y.location === city).slice(0, 4);
      if (stays.length > 0) results.push({ type: "Stays", items: stays });
      if (yachts.length > 0) results.push({ type: "Yachts", items: yachts });
    } else if (currentListing.assetType === "Yachts") {
      // Show Stays and Cars
      const stays = villaListings.filter(v => v.location === city).slice(0, 4);
      const cars = carListings.filter(c => c.location === city).slice(0, 6);
      if (stays.length > 0) results.push({ type: "Stays", items: stays });
      if (cars.length > 0) results.push({ type: "Cars", items: cars });
    }

    return results;
  }, [currentListing.assetType, city]);

  if (complementaryListings.length === 0) return null;

  // Handle toggling a car
  const handleToggleCar = (carListing: Listing) => {
    if (car?.id === carListing.id) {
      removeCar();
    } else {
      setCar(carListing);
    }
  };

  // Handle toggling a yacht
  const handleToggleYacht = (yachtListing: Listing) => {
    if (yachtBooking.yacht?.id === yachtListing.id) {
      removeYacht();
    } else {
      setYacht(yachtListing);
    }
  };

  // Handle car dates change
  const handleCarDatesChange = (pickup: Date | null, dropoff: Date | null) => {
    setCarDates({ pickup, dropoff });
  };

  // Handle yacht booking change
  const handleYachtBookingChange = (date: Date | null, startTime: string | null, endTime: string | null) => {
    setYachtBooking({ startDate: date, startTime, endTime });
  };

  // Handle clicking on a complementary stay item (navigate)
  const handleItemClick = (item: Listing) => {
    navigate(`/listing/${item.id}`);
  };

  // Get price unit
  const getPriceUnit = (type: string) => {
    switch (type) {
      case "Yachts":
        return "/hr";
      case "Cars":
        return "/day";
      default:
        return "/night";
    }
  };

  return (
    <div className="space-y-6 pt-8 border-t border-border-subtle">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Complete Your Trip</h2>
        <p className="text-sm text-muted-foreground mt-1">Optional add-ons in {city}</p>
      </div>

      {complementaryListings.map(({ type, items }) => (
        <div key={type} className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {type}
          </h3>
          
          <div className="relative -mx-6 px-6">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-dark snap-x snap-mandatory">
              {items.map((item) => {
                const priceUnit = getPriceUnit(type);
                
                // For Stays, we just navigate
                if (type === "Stays") {
                  return (
                    <div key={item.id} className="snap-start flex-shrink-0 w-44">
                      <button
                        onClick={() => handleItemClick(item)}
                        className="w-full text-left rounded-xl overflow-hidden bg-secondary/30 border border-border-subtle hover:border-primary/50 transition-all"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3 space-y-2">
                          <h4 className="text-sm font-medium text-foreground line-clamp-1">
                            {item.title}
                          </h4>
                          <div>
                            <span className="text-sm font-semibold text-primary">
                              ${item.price.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {priceUnit}
                            </span>
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                }

                // For Cars
                if (type === "Cars") {
                  const isSelected = car?.id === item.id;
                  return (
                    <AddOnCard
                      key={item.id}
                      item={item}
                      type="Cars"
                      isSelected={isSelected}
                      priceUnit={priceUnit}
                      stayCheckIn={stayDates.checkIn}
                      stayCheckOut={stayDates.checkOut}
                      carPickup={isSelected ? carDates.pickup : null}
                      carDropoff={isSelected ? carDates.dropoff : null}
                      onCarDatesChange={handleCarDatesChange}
                      onToggle={() => handleToggleCar(item)}
                    />
                  );
                }

                // For Yachts
                if (type === "Yachts") {
                  const isSelected = yachtBooking.yacht?.id === item.id;
                  return (
                    <AddOnCard
                      key={item.id}
                      item={item}
                      type="Yachts"
                      isSelected={isSelected}
                      priceUnit={priceUnit}
                      stayCheckIn={stayDates.checkIn}
                      stayCheckOut={stayDates.checkOut}
                      yachtDate={isSelected ? yachtBooking.startDate : null}
                      yachtStartTime={isSelected ? yachtBooking.startTime : null}
                      yachtEndTime={isSelected ? yachtBooking.endTime : null}
                      onYachtBookingChange={handleYachtBookingChange}
                      onToggle={() => handleToggleYacht(item)}
                    />
                  );
                }

                return null;
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CompleteYourTrip;
