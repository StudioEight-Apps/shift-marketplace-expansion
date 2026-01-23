import { Heart, Share2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Listing {
  id: string;
  title: string;
  location: string;
  guests: number;
  rating: number;
  price: number;
  priceUnit: string;
  image: string;
  attributes: string[];
  badges: ("Guest Favorite" | "Reserve")[];
}

interface ListingCardProps {
  listing: Listing;
  className?: string;
}

const ListingCard = ({ listing, className }: ListingCardProps) => {
  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-xl bg-card card-hover cursor-pointer",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={listing.image}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex gap-2">
          {listing.badges.map((badge) => (
            <span
              key={badge}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm",
                badge === "Guest Favorite" 
                  ? "bg-primary/90 text-primary-foreground" 
                  : "bg-secondary/80 text-foreground"
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
            <span className="text-lg font-bold text-primary">${listing.price}</span>
            <p className="text-xs text-muted-foreground">{listing.priceUnit}</p>
          </div>
        </div>
        
        {/* Location, Guests, Rating */}
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <span>{listing.location}</span>
          <span>•</span>
          <span>{listing.guests} guests</span>
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {listing.rating}
          </span>
        </div>
        
        {/* Attributes */}
        <div className="mt-3 flex flex-wrap gap-2">
          {listing.attributes.map((attr) => (
            <span 
              key={attr} 
              className="text-xs text-muted-foreground"
            >
              {attr}
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
