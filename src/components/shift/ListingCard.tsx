import { Star } from "lucide-react";
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
}

const ListingCard = ({ listing, className, onClick }: ListingCardProps) => {
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

  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-lg bg-card card-hover cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* Image Container - 16:10 aspect ratio */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={listing.image}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Top Badge - Single primary badge only */}
        {listing.badges.length > 0 && (
          <span
            className={cn(
              "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm",
              listing.badges[0] === "Guest Favorite" 
                ? "bg-primary/60 text-primary-foreground/90" 
                : "bg-secondary/60 text-foreground/80"
            )}
          >
            {listing.badges[0]}
          </span>
        )}
        
        {/* Bottom Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-16 overlay-gradient" />
      </div>
      
      {/* Content - Tightened padding */}
      <div className="p-3">
        {/* Title and Price Row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-1">
            {listing.title}
          </h3>
          <div className="text-right shrink-0">
            <span className="text-sm font-bold text-primary">${priceDisplay.price}</span>
            <span className="text-[10px] text-muted-foreground">{priceDisplay.unit}</span>
          </div>
        </div>
        
        {/* Location and Rating - Compact */}
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{listing.location}</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {listing.rating}
          </span>
        </div>
        
        {/* Essential Spec Chips - Max 2 */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {specChips.slice(0, 2).map((spec, index) => (
            <span 
              key={index} 
              className="rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] text-muted-foreground"
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
