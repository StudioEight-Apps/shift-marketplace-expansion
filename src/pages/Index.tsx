import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/shift/Header";
import CitySelector, { cities } from "@/components/shift/CitySelector";
import AssetTypeSelector from "@/components/shift/AssetTypeSelector";
import QuickFilters from "@/components/shift/QuickFilters";
import ListingsGrid from "@/components/shift/ListingsGrid";
import EmptyState from "@/components/shift/EmptyState";
import { villaListings, carListings, yachtListings } from "@/data/listings";
import type { Listing } from "@/components/shift/ListingCard";

type AssetType = "Stays" | "Cars" | "Yachts";

// Map city IDs to location strings used in listings data
const cityLocationMap: Record<string, string> = {
  "miami": "Miami",
  "los-angeles": "LA",
  "new-york": "NYC",
  "las-vegas": "Las Vegas",
  "scottsdale": "Scottsdale",
  "aspen": "Aspen",
  "austin": "Austin",
  "nashville": "Nashville",
  "hamptons": "The Hamptons",
  "park-city": "Park City",
};

const Index = () => {
  const navigate = useNavigate();
  const [selectedCityId, setSelectedCityId] = useState("miami");
  const [selectedType, setSelectedType] = useState<AssetType>("Stays");

  const selectedCity = cities.find(c => c.id === selectedCityId);
  const cityHasYachts = selectedCity?.hasYachts ?? false;

  // If city doesn't have yachts and Yachts is selected, switch to Stays
  useEffect(() => {
    if (!cityHasYachts && selectedType === "Yachts") {
      setSelectedType("Stays");
    }
  }, [cityHasYachts, selectedType]);

  const listings = useMemo(() => {
    let allListings;
    switch (selectedType) {
      case "Cars":
        allListings = carListings;
        break;
      case "Yachts":
        allListings = yachtListings;
        break;
      case "Stays":
      default:
        allListings = villaListings;
    }

    // Filter by city using the location map
    const locationString = cityLocationMap[selectedCityId];
    if (locationString) {
      return allListings.filter(l => l.location === locationString);
    }
    
    return allListings;
  }, [selectedCityId, selectedType]);

  const handleListingClick = (listing: Listing) => {
    navigate(`/listing/${listing.id}`);
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
  };

  const displayCityName = selectedCity 
    ? `${selectedCity.name}, ${selectedCity.state}` 
    : "Miami, FL";

  return (
    <div className="min-h-screen bg-background scrollbar-dark">
      <Header />
      
      {/* Primary Navigation - Centered row with City + Asset Type */}
      <section className="border-b border-border-subtle py-4 md:py-6">
        <div className="container px-4 md:px-6">
          {/* Single centered row with city dropdown and asset type tabs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
            <CitySelector 
              selectedCityId={selectedCityId} 
              onCityChange={handleCityChange} 
            />
            
            <AssetTypeSelector 
              selectedType={selectedType} 
              onTypeChange={setSelectedType}
              showYachts={cityHasYachts}
            />
          </div>
          
          {/* Quick Filters - Dynamic based on asset type */}
          <div className="mt-4 md:mt-6">
            <QuickFilters assetType={selectedType} />
          </div>
        </div>
      </section>
      
      {/* Listings Section */}
      <main className="container px-6 py-8 md:py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {selectedType} in {selectedCity?.name || "Miami"}
          </h2>
          <span className="text-sm text-muted-foreground">
            {listings.length} {listings.length === 1 ? "listing" : "listings"}
          </span>
        </div>
        
        {listings.length > 0 ? (
          <ListingsGrid 
            listings={listings} 
            onListingClick={handleListingClick}
          />
        ) : (
          <EmptyState assetType={selectedType} city={selectedCity?.name || "Miami"} />
        )}
      </main>
    </div>
  );
};

export default Index;
