import type { Listing } from "./ListingCard";

interface MobilePopularCarouselProps {
  listings: Listing[];
  onListingClick?: (listing: Listing) => void;
}

const MobilePopularCarousel = ({ listings, onListingClick }: MobilePopularCarouselProps) => {
  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
      <div className="flex gap-3" style={{ width: 'max-content' }}>
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="w-[165px] shrink-0 cursor-pointer group"
            onClick={() => onListingClick?.(listing)}
          >
            {/* Rounded Square Image - Airbnb style */}
            <div className="relative aspect-square overflow-hidden rounded-xl">
              <img
                src={listing.image}
                alt={listing.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Badge */}
              {listing.badges.length > 0 && (
                <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium bg-white text-black shadow-sm">
                  {listing.badges[0]}
                </span>
              )}
            </div>
            
            {/* Content - Airbnb minimal style */}
            <div className="pt-2">
              <h3 className="text-[13px] font-medium text-foreground leading-tight line-clamp-1">
                {listing.title}
              </h3>
              <div className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                <span>${listing.price} {listing.assetType === "Yachts" ? "/ hr" : listing.assetType === "Cars" ? "/ day" : "/ night"}</span>
                <span>·</span>
                <span>{listing.guests} Guests</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobilePopularCarousel;
