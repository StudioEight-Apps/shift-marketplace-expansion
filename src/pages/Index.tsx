import { useState, useMemo } from "react";
import Header from "@/components/shift/Header";
import CitySelector from "@/components/shift/CitySelector";
import AssetTypeSelector from "@/components/shift/AssetTypeSelector";
import QuickFilters from "@/components/shift/QuickFilters";
import ListingsGrid from "@/components/shift/ListingsGrid";
import EmptyState from "@/components/shift/EmptyState";
import { villaListings, carListings, yachtListings } from "@/data/listings";

type AssetType = "Villas" | "Cars" | "Yachts";

const Index = () => {
  const [selectedCity, setSelectedCity] = useState("Miami");
  const [selectedType, setSelectedType] = useState<AssetType>("Villas");

  const listings = useMemo(() => {
    let allListings;
    switch (selectedType) {
      case "Cars":
        allListings = carListings;
        break;
      case "Yachts":
        allListings = yachtListings;
        break;
      default:
        allListings = villaListings;
    }

    // Filter by city
    if (selectedCity === "NYC") {
      return allListings.filter(l => l.location === "NYC");
    } else if (selectedCity === "LA") {
      return allListings.filter(l => l.location === "LA");
    } else if (selectedCity === "Miami") {
      return allListings.filter(l => l.location === "Miami");
    }
    
    return allListings;
  }, [selectedCity, selectedType]);

  return (
    <div className="min-h-screen bg-background scrollbar-dark">
      <Header />
      
      {/* Controls Section */}
      <section className="border-b border-border-subtle py-4">
        <div className="container space-y-3 px-6">
          {/* City Selector */}
          <CitySelector 
            selectedCity={selectedCity} 
            onCityChange={setSelectedCity} 
          />
          
          {/* Asset Type Selector */}
          <AssetTypeSelector 
            selectedType={selectedType} 
            onTypeChange={setSelectedType} 
          />
          
          {/* Quick Filters - Dynamic based on asset type */}
          <QuickFilters assetType={selectedType} />
        </div>
      </section>
      
      {/* Listings Section */}
      <main className="container px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {selectedType} in {selectedCity}
          </h2>
          <span className="text-sm text-muted-foreground">
            {listings.length} {listings.length === 1 ? "listing" : "listings"}
          </span>
        </div>
        
        {listings.length > 0 ? (
          <ListingsGrid listings={listings} />
        ) : (
          <EmptyState assetType={selectedType} city={selectedCity} />
        )}
      </main>
    </div>
  );
};

export default Index;
