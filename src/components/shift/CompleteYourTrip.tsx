import { useTrip } from "@/context/TripContext";
import CompactAddOnRail from "./CompactAddOnRail";
import type { Listing } from "./ListingCard";

interface CompleteYourTripProps {
  currentListing: Listing;
  city: string;
}

const CompleteYourTrip = ({ currentListing, city }: CompleteYourTripProps) => {
  const { stayDates } = useTrip();

  // Only show for Stays and when dates are selected
  if (currentListing.assetType !== "Stays") return null;
  if (!stayDates.checkIn || !stayDates.checkOut) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Complete Your Trip</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add a car or yacht to your stay.
        </p>
      </div>

      <CompactAddOnRail city={city} variant="full" />
    </div>
  );
};

export default CompleteYourTrip;
