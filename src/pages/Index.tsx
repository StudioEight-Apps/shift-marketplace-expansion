import { useState, useMemo } from "react";
import Header from "@/components/shift/Header";
import CitySelector from "@/components/shift/CitySelector";
import AssetTypeSelector from "@/components/shift/AssetTypeSelector";
import QuickFilters from "@/components/shift/QuickFilters";
import ListingsGrid from "@/components/shift/ListingsGrid";
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

    // Filter by city if not showing all
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
      <section className="border-b border-border-subtle py-6">
        <div className="container space-y-5 px-6">
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
          
          {/* Quick Filters */}
          <QuickFilters />
        </div>
      </section>
      
      {/* Listings Section */}
      <main className="container px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            {selectedType} in {selectedCity}
          </h2>
          <span className="text-sm text-muted-foreground">
            {listings.length} {listings.length === 1 ? "listing" : "listings"}
          </span>
        </div>
        
        <ListingsGrid listings={listings} />
        
        {listings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg text-muted-foreground">
              No {selectedType.toLowerCase()} available in {selectedCity}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try selecting a different city
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
