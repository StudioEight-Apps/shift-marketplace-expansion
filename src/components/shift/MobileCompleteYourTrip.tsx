import { useMemo, useState } from "react";
import { Plus, Check, Car, Anchor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrip } from "@/context/TripContext";
import { carListings, yachtListings } from "@/data/listings";
import AddOnSchedulingDrawer, { type CarSchedule, type YachtSchedule } from "./AddOnSchedulingDrawer";
import type { Listing } from "./ListingCard";
import { toast } from "@/hooks/use-toast";

interface MobileCompleteYourTripProps {
  city: string;
}

const MobileCompleteYourTrip = ({ city }: MobileCompleteYourTripProps) => {
  const {
    stayDates,
    car,
    setCar,
    setCarDates,
    removeCar,
    yachtBooking,
    setYacht,
    setYachtBooking,
    removeYacht,
  } = useTrip();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Listing | null>(null);
  const [selectedType, setSelectedType] = useState<"Cars" | "Yachts">("Cars");

  // Only show if stay dates are set
  if (!stayDates.checkIn || !stayDates.checkOut) return null;

  // Get available cars and yachts in the city
  const availableCars = useMemo(
    () => carListings.filter((c) => c.location === city),
    [city]
  );

  const availableYachts = useMemo(
    () => yachtListings.filter((y) => y.location === city),
    [city]
  );

  const handleAddClick = (item: Listing, type: "Cars" | "Yachts") => {
    // If already added, remove it
    if (type === "Cars" && car?.id === item.id) {
      removeCar();
      toast({ title: "Removed from trip", duration: 2000 });
      return;
    }
    if (type === "Yachts" && yachtBooking.yacht?.id === item.id) {
      removeYacht();
      toast({ title: "Removed from trip", duration: 2000 });
      return;
    }

    // Open drawer to schedule
    setSelectedItem(item);
    setSelectedType(type);
    setDrawerOpen(true);
  };

  const handleScheduleConfirm = (scheduleData: CarSchedule | YachtSchedule) => {
    if (scheduleData.type === "car" && selectedItem) {
      setCar(selectedItem);
      setCarDates({ pickup: scheduleData.pickup, dropoff: scheduleData.dropoff });
      toast({ title: "Added to trip", duration: 2000 });
    } else if (scheduleData.type === "yacht" && selectedItem) {
      setYacht(selectedItem);
      setYachtBooking({
        startDate: scheduleData.date,
        startTime: scheduleData.startTime,
        endTime: scheduleData.endTime,
      });
      toast({ title: "Added to trip", duration: 2000 });
    }
  };

  const isCarAdded = (item: Listing) => car?.id === item.id;
  const isYachtAdded = (item: Listing) => yachtBooking.yacht?.id === item.id;

  return (
    <>
      <div className="space-y-6 py-6 border-t border-border-subtle">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Complete Your Trip</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add a car or yacht to your stay
          </p>
        </div>

        {/* Cars Section */}
        {availableCars.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Add a Car</span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-dark">
              {availableCars.map((item) => {
                const isAdded = isCarAdded(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleAddClick(item, "Cars")}
                    className="group flex-shrink-0 w-[280px] text-left"
                  >
                    <div className="relative h-[160px] rounded-xl overflow-hidden bg-card">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Add/Remove button */}
                      <button
                        className={cn(
                          "absolute bottom-3 right-3 h-9 px-4 rounded-full font-medium text-sm flex items-center gap-1.5 transition-all duration-200",
                          isAdded
                            ? "bg-primary text-primary-foreground"
                            : "bg-card/90 backdrop-blur-sm text-foreground hover:bg-primary hover:text-primary-foreground"
                        )}
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-4 w-4" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Add
                          </>
                        )}
                      </button>
                    </div>
                    <div className="mt-2.5 px-1">
                      <h4 className="text-sm font-medium text-foreground line-clamp-1">
                        {item.title}
                      </h4>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-semibold text-primary">
                          ${item.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">/day</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Yachts Section */}
        {availableYachts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Anchor className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Add a Yacht</span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-dark">
              {availableYachts.map((item) => {
                const isAdded = isYachtAdded(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleAddClick(item, "Yachts")}
                    className="group flex-shrink-0 w-[280px] text-left"
                  >
                    <div className="relative h-[160px] rounded-xl overflow-hidden bg-card">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Add/Remove button */}
                      <button
                        className={cn(
                          "absolute bottom-3 right-3 h-9 px-4 rounded-full font-medium text-sm flex items-center gap-1.5 transition-all duration-200",
                          isAdded
                            ? "bg-primary text-primary-foreground"
                            : "bg-card/90 backdrop-blur-sm text-foreground hover:bg-primary hover:text-primary-foreground"
                        )}
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-4 w-4" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Add
                          </>
                        )}
                      </button>
                    </div>
                    <div className="mt-2.5 px-1">
                      <h4 className="text-sm font-medium text-foreground line-clamp-1">
                        {item.title}
                      </h4>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-semibold text-primary">
                          ${item.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">/hour</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Scheduling Drawer */}
      {selectedItem && stayDates.checkIn && stayDates.checkOut && (
        <AddOnSchedulingDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          item={selectedItem}
          type={selectedType}
          stayCheckIn={stayDates.checkIn}
          stayCheckOut={stayDates.checkOut}
          onConfirm={handleScheduleConfirm}
        />
      )}
    </>
  );
};

export default MobileCompleteYourTrip;
