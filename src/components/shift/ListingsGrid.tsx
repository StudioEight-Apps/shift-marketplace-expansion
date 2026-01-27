import ListingCard, { Listing } from "./ListingCard";

interface ListingsGridProps {
  listings: Listing[];
  onListingClick?: (listing: Listing) => void;
}

const ListingsGrid = ({ listings, onListingClick }: ListingsGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard 
          key={listing.id} 
          listing={listing}
          className="animate-fade-in"
          onClick={() => onListingClick?.(listing)}
        />
      ))}
    </div>
  );
};

export default ListingsGrid;
