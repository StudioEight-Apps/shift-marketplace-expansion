import ListingCard, { Listing } from "./ListingCard";

interface ListingsGridProps {
  listings: Listing[];
  onListingClick?: (listing: Listing) => void;
  compact?: boolean;
}

const ListingsGrid = ({ listings, onListingClick, compact = false }: ListingsGridProps) => {
  return (
    <div className={
      compact
        ? "grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4"
        : "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4"
    }>
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          className="animate-fade-in"
          onClick={() => onListingClick?.(listing)}
          compact={compact}
        />
      ))}
    </div>
  );
};

export default ListingsGrid;
