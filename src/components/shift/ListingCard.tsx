import { cn } from "@/lib/utils";

type AssetType = "Stays" | "Cars" | "Yachts";

export interface Listing {
  id: string;
  title: string;
  location: string;
  guests: number;
  bedrooms?: number;
  length?: number;
  bodyStyle?: string;
  seats?: number;
  power?: string;
  rating: number;
  price: number;
  priceUnit: string;
  image: string;
  images?: string[]; // Array of images for gallery
  attributes: string[];
  badges: ("Guest Favorite" | "Reserve")[];
  assetType?: AssetType;
}

interface ListingCardProps {
  listing: Listing;
  className?: string;
  onClick?: () => void;
  compact?: boolean;
}

const ListingCard = ({ listing, className, onClick, compact = false }: ListingCardProps) => {
  // Get price display based on asset type
  const getPriceDisplay = () => {
    const assetType = listing.assetType || "Villas";
    switch (assetType) {
      case "Yachts":
        return { price: listing.price, unit: "/ hour" };
      default: // Stays and Cars use per day
        return { price: listing.price, unit: "/ day" };
    }
  };

  // Get spec chips based on asset type (max 3)
  const getSpecChips = () => {
    const assetType = listing.assetType || "Villas";
    switch (assetType) {
      case "Cars":
        return [
          listing.bodyStyle || listing.attributes[0],
          `${listing.seats || listing.guests} Seats`,
          listing.power || listing.attributes[2],
        ].filter(Boolean).slice(0, 3);
      case "Yachts":
        return [
          `${listing.guests} Guests`,
          listing.length ? `${listing.length}ft` : listing.attributes[0],
          "Crew Included",
        ].filter(Boolean).slice(0, 3);
      default: // Stays
        return [
          `${listing.guests} Guests`,
          listing.bedrooms ? `${listing.bedrooms} Beds` : null,
          listing.attributes[0], // Premium amenity
        ].filter(Boolean).slice(0, 3);
    }
  };

  const priceDisplay = getPriceDisplay();
  const specChips = getSpecChips();

  // Compact mode for mobile filtered results
  if (compact) {
    return (
      <div
        className={cn(
          "group relative overflow-hidden bg-card cursor-pointer transition-all duration-300 ease-out",
          "rounded-xl shadow-card hover:shadow-elevated",
          className
        )}
        onClick={onClick}
      >
        {/* Image - Square aspect for compact */}
        <div className="relative aspect-square overflow-hidden rounded-t-xl">
          <img
            src={listing.image}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {listing.badges.length > 0 && (
            <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-medium bg-white text-black shadow-sm">
              {listing.badges[0]}
            </span>
          )}
        </div>

        {/* Compact Content */}
        <div className="p-2.5">
          <h3 className="text-[12px] font-semibold text-foreground leading-tight line-clamp-1">
            {listing.title}
          </h3>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground line-clamp-1">{listing.location}</span>
          </div>
          <div className="mt-1">
            <span className="text-[12px] font-semibold text-foreground">${priceDisplay.price}</span>
            <span className="text-[9px] text-muted-foreground ml-0.5">{priceDisplay.unit}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden bg-card cursor-pointer transition-all duration-300 ease-out",
        "rounded-[14px] shadow-card hover:shadow-elevated hover:bg-card-hover",
        "hover:-translate-y-1",
        className
      )}
      onClick={onClick}
    >
      {/* Image Container - 16:10 aspect ratio at ~58% of card height */}
      <div className="relative aspect-[16/10] overflow-hidden rounded-t-[14px]">
        <img
          src={listing.image}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top Badge - Single badge, subdued styling */}
        {listing.badges.length > 0 && (
          <span
            className={cn(
              "absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[9px] font-medium",
              "bg-black/50 backdrop-blur-md border border-white/10",
              listing.badges[0] === "Guest Favorite"
                ? "text-primary/90"
                : "text-white/70"
            )}
          >
            {listing.badges[0]}
          </span>
        )}

      </div>

      {/* Content - Refined spacing */}
      <div className="p-3.5">
        {/* Title and Price Row */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[13px] font-semibold text-foreground leading-tight line-clamp-1">
            {listing.title}
          </h3>
          <div className="text-right shrink-0">
            <span className="text-[13px] font-semibold text-foreground">${priceDisplay.price}</span>
            <span className="text-[9px] text-muted-foreground ml-0.5">{priceDisplay.unit}</span>
          </div>
        </div>

        {/* Location */}
        <div className="mt-1.5 text-[11px] text-muted-foreground">
          <span>{listing.location}</span>
        </div>

        {/* Essential Spec Pills - Max 2, subdued */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {specChips.slice(0, 2).map((spec, index) => (
            <span
              key={index}
              className="rounded-full bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[9px] text-muted-foreground"
            >
              {spec}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
