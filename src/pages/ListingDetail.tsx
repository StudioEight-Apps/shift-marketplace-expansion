import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Users, Bed, MapPin, Anchor, Car as CarIcon, Gauge } from "lucide-react";
import { TripProvider, useTrip } from "@/context/TripContext";
import { villaListings, carListings, yachtListings } from "@/data/listings";
import Header from "@/components/shift/Header";
import CompleteYourTrip from "@/components/shift/CompleteYourTrip";
import BookingCard from "@/components/shift/BookingCard";
import ImageGallery from "@/components/shift/ImageGallery";
import type { Listing } from "@/components/shift/ListingCard";

// All listings combined for lookup
const allListings = [...villaListings, ...carListings, ...yachtListings];

const ListingDetailContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setStay, stayDates, setStayDates } = useTrip();

  // Standalone date state for Cars and Yachts (not tied to trip container)
  const [standaloneDates, setStandaloneDates] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  const listing = useMemo(() => {
    return allListings.find(l => l.id === id) || null;
  }, [id]);

  // Set the primary booking item in context (only Stays are trip containers)
  useEffect(() => {
    if (listing && listing.assetType === "Stays") {
      setStay(listing);
    }
  }, [listing, setStay]);

  // Reset standalone dates when listing changes
  useEffect(() => {
    setStandaloneDates({ start: null, end: null });
  }, [id]);

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-6 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Listing Not Found</h1>
          <button
            onClick={() => navigate("/")}
            className="text-primary hover:underline"
          >
            Return to listings
          </button>
        </div>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get price unit display based on asset type
  const getPriceUnit = () => {
    switch (listing.assetType) {
      case "Yachts":
        return "hour";
      case "Cars":
        return "day";
      case "Stays":
      default:
        return "night";
    }
  };

  // Get date labels based on asset type
  const getDateLabels = () => {
    switch (listing.assetType) {
      case "Cars":
        return { start: "Pick-up", end: "Drop-off" };
      case "Yachts":
        return { start: "Start Date", end: "End Date" };
      case "Stays":
      default:
        return { start: "Check-in", end: "Check-out" };
    }
  };

  // Get specs based on asset type
  const getSpecs = () => {
    switch (listing.assetType) {
      case "Cars":
        return [
          { icon: Users, label: `${listing.seats || listing.guests} Seats`, value: "" },
          { icon: Gauge, label: listing.power || "", value: "" },
          { icon: CarIcon, label: listing.bodyStyle || "", value: "" },
        ].filter(s => s.label);
      case "Yachts":
        return [
          { icon: Users, label: `${listing.guests} Guests`, value: "" },
          { icon: Anchor, label: `${listing.length}ft`, value: "" },
        ];
      case "Stays":
      default:
        return [
          { icon: Users, label: `${listing.guests} Guests`, value: "" },
          { icon: Bed, label: `${listing.bedrooms} Bedrooms`, value: "" },
        ];
    }
  };

  const dateLabels = getDateLabels();
  const specs = getSpecs();

  // For Stays, use stayDates (trip container). For Cars/Yachts, use standalone dates
  const isStay = listing.assetType === "Stays";
  const currentDates = isStay 
    ? { start: stayDates.checkIn, end: stayDates.checkOut }
    : standaloneDates;

  const handleDateChange = (start: Date | null, end: Date | null) => {
    if (isStay) {
      setStayDates({ checkIn: start, checkOut: end });
    } else {
      setStandaloneDates({ start, end });
    }
  };

  return (
    <div className="min-h-screen bg-background scrollbar-dark">
      <Header />

      {/* Image Gallery */}
      <ImageGallery 
        images={listing.images || [listing.image]} 
        title={listing.title} 
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-16">
          {/* Left Column - Details */}
          <div className="lg:col-span-3 space-y-6">
            {/* Title & Location */}
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
                {listing.title}
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground text-sm">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {listing.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {listing.rating}
                </span>
              </div>
            </div>

            {/* Core Specs Row (capacity + standout features in one glance) */}
            <div className="flex flex-wrap items-center gap-2 py-4 border-b border-border-subtle">
              {specs.map((spec, i) => (
                <span
                  key={`spec-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground"
                >
                  <spec.icon className="h-3.5 w-3.5" />
                  {spec.label}
                </span>
              ))}

              {listing.attributes.map((attr, i) => (
                <span
                  key={`highlight-${i}`}
                  className="inline-flex items-center rounded-full bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground"
                >
                  {attr}
                </span>
              ))}
            </div>

            {/* Description */}
            <div className="py-6 border-b border-border-subtle">
              <h2 className="text-base font-medium text-foreground mb-3">About this {listing.assetType?.slice(0, -1).toLowerCase() || "listing"}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Experience luxury like never before with this exceptional {listing.title.toLowerCase()} in {listing.location}. 
                Perfect for those seeking an unforgettable experience, this {listing.assetType?.slice(0, -1).toLowerCase() || "listing"} offers 
                world-class amenities and impeccable attention to detail. A dedicated Shift concierge will ensure 
                every aspect of your booking exceeds expectations.
              </p>
            </div>

            {/* Complete Your Trip Section - Only for Stays */}
            {listing.assetType === "Stays" && (
              <div className="pt-6">
                <CompleteYourTrip 
                  currentListing={listing} 
                  city={listing.location}
                />
              </div>
            )}
          </div>

          {/* Right Column - Booking Card (Sticky) */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 max-w-sm ml-auto">
              <BookingCard
                listing={listing}
                priceUnit={getPriceUnit()}
                dateLabels={dateLabels}
                currentDates={currentDates}
                onDateChange={handleDateChange}
                minDate={today}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ListingDetail = () => {
  return (
    <TripProvider>
      <ListingDetailContent />
    </TripProvider>
  );
};

export default ListingDetail;
