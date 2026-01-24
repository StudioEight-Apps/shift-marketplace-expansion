import { Heart, Share2, Star } from "lucide-react";
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
        "group relative overflow-hidden rounded-xl bg-card card-hover cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={listing.image}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Top Badges - More subtle styling */}
        <div className="absolute left-3 top-3 flex gap-2">
          {listing.badges.map((badge) => (
            <span
              key={badge}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-sm",
                badge === "Guest Favorite" 
                  ? "bg-primary/60 text-primary-foreground/90" 
                  : "bg-secondary/60 text-foreground/80"
              )}
            >
              {badge}
            </span>
          ))}
        </div>
        
        {/* Bottom Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-32 overlay-gradient" />
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Title and Price Row */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-foreground leading-tight">
            {listing.title}
          </h3>
          <div className="text-right shrink-0">
            <span className="text-lg font-bold text-primary">${priceDisplay.price}</span>
            <p className="text-xs text-muted-foreground">{priceDisplay.unit}</p>
          </div>
        </div>
        
        {/* Location and Rating */}
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <span>{listing.location}</span>
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {listing.rating}
          </span>
        </div>
        
        {/* Spec Chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {specChips.map((spec, index) => (
            <span 
              key={index} 
              className="rounded-full bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground"
            >
              {spec}
            </span>
          ))}
        </div>
        
        {/* Actions */}
        <div className="mt-4 flex items-center gap-4 border-t border-border-subtle pt-4">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Heart className="h-4 w-4" />
            Save
          </button>
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
