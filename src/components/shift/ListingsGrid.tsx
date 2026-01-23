import ListingCard, { Listing } from "./ListingCard";

interface ListingsGridProps {
  listings: Listing[];
}

const ListingsGrid = ({ listings }: ListingsGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard 
          key={listing.id} 
          listing={listing}
          className="animate-fade-in"
        />
      ))}
    </div>
  );
};

export default ListingsGrid;
