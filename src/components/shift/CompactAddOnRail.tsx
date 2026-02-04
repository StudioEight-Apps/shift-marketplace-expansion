import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Car, Anchor, ChevronRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrip } from "@/context/TripContext";
import { getCars, getYachts, carToListing, yachtToListing, Car as CarType, Yacht } from "@/lib/listings";
import AddOnSchedulingDrawer, { type CarSchedule, type YachtSchedule } from "./AddOnSchedulingDrawer";
import ViewAllAddOnsModal from "./ViewAllAddOnsModal";
import type { Listing } from "./ListingCard";

interface CompactAddOnRailProps {
  city: string;
  variant?: "compact" | "full";
}

const CompactAddOnRail = ({ city, variant = "compact" }: CompactAddOnRailProps) => {
  const {
    stayDates,
    car, setCar, setCarDates, removeCar,
    yachtBooking, setYacht, setYachtBooking, removeYacht,
    carDays, yachtHours
  } = useTrip();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Listing | null>(null);
  const [selectedType, setSelectedType] = useState<"Cars" | "Yachts">("Cars");
  const [viewAllType, setViewAllType] = useState<"Cars" | "Yachts" | null>(null);

  // Firestore data state
  const [carsData, setCarsData] = useState<CarType[]>([]);
  const [yachtsData, setYachtsData] = useState<Yacht[]>([]);

  // Fetch from Firestore
  useEffect(() => {
    const unsubCars = getCars((data) => {
      setCarsData(data.filter(c => c.status === "active"));
    });
    const unsubYachts = getYachts((data) => {
      setYachtsData(data.filter(y => y.status === "active"));
    });

    return () => {
      unsubCars();
      unsubYachts();
    };
  }, []);

  // Convert to Listing format
  const carListings = useMemo(() => carsData.map(carToListing), [carsData]);
  const yachtListings = useMemo(() => yachtsData.map(yachtToListing), [yachtsData]);

  // Only show if stay dates are set
  if (!stayDates.checkIn || !stayDates.checkOut) return null;

  // Get available cars and yachts in the city
  const availableCars = useMemo(() =>
    carListings.filter(c => c.location === city).slice(0, variant === "compact" ? 4 : 6),
    [city, variant, carListings]
  );

  const availableYachts = useMemo(() =>
    yachtListings.filter(y => y.location === city).slice(0, variant === "compact" ? 3 : 4),
    [city, variant, yachtListings]
  );

  const allCars = useMemo(() => carListings.filter(c => c.location === city), [city, carListings]);
  const allYachts = useMemo(() => yachtListings.filter(y => y.location === city), [city, yachtListings]);

  const handleAddClick = (item: Listing, type: "Cars" | "Yachts") => {
    setSelectedItem(item);
    setSelectedType(type);
    setDrawerOpen(true);
  };

  const handleScheduleConfirm = (scheduleData: CarSchedule | YachtSchedule) => {
    if (scheduleData.type === "car" && selectedItem) {
      setCar(selectedItem);
      setCarDates({ pickup: scheduleData.pickup, dropoff: scheduleData.dropoff });
    } else if (scheduleData.type === "yacht" && selectedItem) {
      setYacht(selectedItem);
      setYachtBooking({
        startDate: scheduleData.date,
        startTime: scheduleData.startTime,
        endTime: scheduleData.endTime,
      });
    }
  };

  const handleViewAllSelect = (item: Listing) => {
    setSelectedItem(item);
    setSelectedType(viewAllType!);
    setDrawerOpen(true);
  };

  // Render added item summary
  const renderAddedItem = (item: Listing, type: "Cars" | "Yachts", onRemove: () => void) => {
    const Icon = type === "Cars" ? Car : Anchor;
    const schedule = type === "Cars" 
      ? `${carDays} ${carDays === 1 ? "day" : "days"}`
      : `${yachtHours} ${yachtHours === 1 ? "hour" : "hours"}`;

    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/30">
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground line-clamp-1">{item.title}</h4>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="h-3 w-3" />
            <span>{schedule}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-primary" />
          <button
            onClick={onRemove}
            className="p-1 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4">

        {/* Cars Section */}
        {(availableCars.length > 0 || car) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Cars</span>
              </div>
              {!car && allCars.length > (variant === "compact" ? 4 : 6) && (
                <button
                  onClick={() => setViewAllType("Cars")}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View all available cars
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>

            {car ? (
              renderAddedItem(car, "Cars", removeCar)
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-dark">
                {availableCars.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleAddClick(item, "Cars")}
                    className="group flex-shrink-0 w-36 text-left"
                  >
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-2">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm">
                        <span className="text-[9px] text-white/90">Available</span>
                      </div>
                    </div>
                    <h4 className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <div className="text-xs">
                      <span className="font-semibold text-primary">${item.price.toLocaleString()}</span>
                      <span className="text-muted-foreground">/day</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Yachts Section */}
        {(availableYachts.length > 0 || yachtBooking.yacht) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Anchor className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Yachts</span>
              </div>
              {!yachtBooking.yacht && allYachts.length > (variant === "compact" ? 3 : 4) && (
                <button
                  onClick={() => setViewAllType("Yachts")}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View all available yachts
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>

            {yachtBooking.yacht ? (
              renderAddedItem(yachtBooking.yacht, "Yachts", removeYacht)
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-dark">
                {availableYachts.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleAddClick(item, "Yachts")}
                    className="group flex-shrink-0 w-36 text-left"
                  >
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-2">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm">
                        <span className="text-[9px] text-white/90">Available</span>
                      </div>
                    </div>
                    <h4 className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <div className="text-xs">
                      <span className="font-semibold text-primary">${item.price.toLocaleString()}</span>
                      <span className="text-muted-foreground">/hr</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
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

      {/* View All Modal */}
      {viewAllType && stayDates.checkIn && stayDates.checkOut && (
        <ViewAllAddOnsModal
          open={viewAllType !== null}
          onOpenChange={(open) => !open && setViewAllType(null)}
          type={viewAllType}
          items={viewAllType === "Cars" ? allCars : allYachts}
          stayCheckIn={stayDates.checkIn}
          stayCheckOut={stayDates.checkOut}
          onSelectItem={handleViewAllSelect}
        />
      )}
    </>
  );
};

export default CompactAddOnRail;
