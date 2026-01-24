import { useEffect, useMemo } from "react";
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
  const { setStay, setCar, stayDates, setStayDates, carDates, setCarDates } = useTrip();

  const listing = useMemo(() => {
    return allListings.find(l => l.id === id) || null;
  }, [id]);

  // Set the primary booking item in context
  useEffect(() => {
    if (listing) {
      if (listing.assetType === "Stays") {
        setStay(listing);
      } else if (listing.assetType === "Cars") {
        setCar(listing);
      }
    }
  }, [listing, setStay, setCar]);

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
        return { start: "Start", end: "End" };
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

  // Determine current dates based on asset type
  const currentDates = listing.assetType === "Cars" 
    ? { start: carDates.pickup, end: carDates.dropoff }
    : { start: stayDates.checkIn, end: stayDates.checkOut };

  const handleDateChange = (start: Date | null, end: Date | null) => {
    if (listing.assetType === "Cars") {
      setCarDates({ pickup: start, dropoff: end });
    } else {
      setStayDates({ checkIn: start, checkOut: end });
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
      <div className="container px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Location */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                {listing.title}
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground">
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

            {/* Key Specs */}
            <div className="flex gap-4 flex-wrap">
              {specs.map((spec, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-secondary/30 px-5 py-4">
                  <spec.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">{spec.label}</span>
                </div>
              ))}
            </div>

            {/* Highlights */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Highlights</h2>
              <div className="flex flex-wrap gap-2">
                {listing.attributes.map((attr, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-secondary/50 px-4 py-2 text-sm text-muted-foreground"
                  >
                    {attr}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">About this {listing.assetType?.slice(0, -1).toLowerCase() || "listing"}</h2>
              <p className="text-muted-foreground leading-relaxed">
                Experience luxury like never before with this exceptional {listing.title.toLowerCase()} in {listing.location}. 
                Perfect for those seeking an unforgettable experience, this {listing.assetType?.slice(0, -1).toLowerCase() || "listing"} offers 
                world-class amenities and impeccable attention to detail. A dedicated Shift concierge will ensure 
                every aspect of your booking exceeds expectations.
              </p>
            </div>

            {/* Complete Your Trip Section - Only for Stays and Cars */}
            {(listing.assetType === "Stays" || listing.assetType === "Cars" || listing.assetType === "Yachts") && (
              <CompleteYourTrip 
                currentListing={listing} 
                city={listing.location}
              />
            )}
          </div>

          {/* Right Column - Booking Card (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
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
