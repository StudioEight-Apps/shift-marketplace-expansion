import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/shift/Header";
import { cities } from "@/components/shift/CitySelector";
import SearchPill from "@/components/shift/SearchPill";
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
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const selectedCity = cities.find(c => c.id === selectedCityId);
  const cityHasYachts = selectedCity?.hasYachts ?? false;

  // If city doesn't have yachts and Yachts is selected, switch to Stays
  useEffect(() => {
    if (!cityHasYachts && selectedType === "Yachts") {
      setSelectedType("Stays");
    }
  }, [cityHasYachts, selectedType]);

  // Reset dates when switching between single-day and range modes
  useEffect(() => {
    if (selectedType === "Cars" || selectedType === "Yachts") {
      setEndDate(null);
    }
  }, [selectedType]);

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

  const handleDateChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className="min-h-screen bg-background scrollbar-dark">
      <Header />
      
      {/* 3-Tier Navigation Stack */}
      <section className="border-b border-border-subtle py-6 md:py-8">
        <div className="container px-4 md:px-6 flex flex-col items-center gap-8">
          {/* Tier 1: Floating Search Pill */}
          <SearchPill
            selectedCityId={selectedCityId}
            onCityChange={handleCityChange}
            selectedType={selectedType}
            startDate={startDate}
            endDate={endDate}
            onDateChange={handleDateChange}
          />
          
          {/* Tier 2: Category Selector */}
          <AssetTypeSelector 
            selectedType={selectedType} 
            onTypeChange={setSelectedType}
            showYachts={cityHasYachts}
          />
          
          {/* Tier 3: Dynamic Quick Filters */}
          <QuickFilters assetType={selectedType} />
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
