import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Listing } from "./ListingCard";

interface MobilePopularCarouselProps {
  listings: Listing[];
  onListingClick?: (listing: Listing) => void;
}

const MobilePopularCarousel = ({ listings, onListingClick }: MobilePopularCarouselProps) => {
  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
      <div className="flex gap-3" style={{ width: 'max-content' }}>
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="w-[160px] shrink-0 cursor-pointer"
            onClick={() => onListingClick?.(listing)}
          >
            {/* Compact Card */}
            <div className="group rounded-xl overflow-hidden bg-card shadow-card">
              {/* Image - Square aspect ratio for compact cards */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Badge */}
                {listing.badges.length > 0 && (
                  <span className="absolute left-2 top-2 rounded-full px-1.5 py-0.5 text-[8px] font-medium bg-black/50 backdrop-blur-md border border-white/10 text-white/80">
                    {listing.badges[0]}
                  </span>
                )}
              </div>
              
              {/* Content - Minimal */}
              <div className="p-2.5">
                <h3 className="text-[11px] font-semibold text-foreground leading-tight line-clamp-1">
                  {listing.title}
                </h3>
                <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{listing.location}</span>
                  <span className="flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    {listing.rating}
                  </span>
                </div>
                <div className="mt-1.5">
                  <span className="text-[11px] font-semibold text-foreground">${listing.price}</span>
                  <span className="text-[9px] text-muted-foreground ml-0.5">/ day</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobilePopularCarousel;
