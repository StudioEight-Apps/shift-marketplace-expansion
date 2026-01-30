import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { MapPin, CalendarDays } from "lucide-react";
import Header from "@/components/shift/Header";
import Footer from "@/components/shift/Footer";
import { cities } from "@/components/shift/CitySelector";
import SearchPill from "@/components/shift/SearchPill";
import AssetTypeSelector from "@/components/shift/AssetTypeSelector";
import QuickFilters from "@/components/shift/QuickFilters";
import ListingsGrid from "@/components/shift/ListingsGrid";
import EmptyState from "@/components/shift/EmptyState";
import { villaListings, carListings, yachtListings } from "@/data/listings";
import { useSearch } from "@/context/SearchContext";
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

// Featured destinations for when no dates are selected
const featuredDestinations = [
  { id: "miami", name: "Miami", state: "FL", image: "https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=400&h=300&fit=crop" },
  { id: "los-angeles", name: "Los Angeles", state: "CA", image: "https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=400&h=300&fit=crop" },
  { id: "new-york", name: "New York", state: "NY", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop" },
  { id: "aspen", name: "Aspen", state: "CO", image: "https://images.unsplash.com/photo-1609603825832-a2fe5e235d43?w=400&h=300&fit=crop" },
];

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { cityId: searchCityId, startDate, endDate, setCityId, setSearchDates, hasDates } = useSearch();
  const [selectedCityId, setSelectedCityId] = useState(searchCityId);
  const [selectedType, setSelectedType] = useState<AssetType>("Stays");

  // Parse dates from URL on mount
  useEffect(() => {
    const urlCity = searchParams.get("city");
    const urlCheckin = searchParams.get("checkin");
    const urlCheckout = searchParams.get("checkout");
    
    if (urlCity) {
      const city = cities.find(c => c.id === urlCity || c.name.toLowerCase() === urlCity.toLowerCase());
      if (city) {
        setSelectedCityId(city.id);
        setCityId(city.id);
      }
    }
    
    if (urlCheckin && urlCheckout) {
      try {
        const checkinDate = parseISO(urlCheckin);
        const checkoutDate = parseISO(urlCheckout);
        setSearchDates(checkinDate, checkoutDate);
      } catch (e) {
        // Invalid dates, ignore
      }
    }
  }, []);

  // Sync local city state with global search context
  useEffect(() => {
    setCityId(selectedCityId);
  }, [selectedCityId, setCityId]);

  const selectedCity = cities.find(c => c.id === selectedCityId);
  const cityHasYachts = selectedCity?.hasYachts ?? false;

  // If city doesn't have yachts and Yachts is selected, switch to Stays
  useEffect(() => {
    if (!cityHasYachts && selectedType === "Yachts") {
      setSelectedType("Stays");
    }
  }, [cityHasYachts, selectedType]);

  // Reset end date when switching to single-day modes
  useEffect(() => {
    if (selectedType === "Cars" || selectedType === "Yachts") {
      setSearchDates(startDate, null);
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
    setSearchDates(start, end);
  };

  const handleSearch = () => {
    if (!hasDates) return;
    
    // Update URL with search params
    const params = new URLSearchParams();
    params.set("city", selectedCityId);
    if (startDate) params.set("checkin", format(startDate, "yyyy-MM-dd"));
    if (endDate) params.set("checkout", format(endDate, "yyyy-MM-dd"));
    
    setSearchParams(params);
  };

  const handleDestinationClick = (cityId: string) => {
    setSelectedCityId(cityId);
    setCityId(cityId);
  };

  return (
    <div className="min-h-screen bg-background scrollbar-dark flex flex-col">
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
            onSearch={handleSearch}
          />
          
          {/* Tier 2: Category Selector */}
          <AssetTypeSelector 
            selectedType={selectedType} 
            onTypeChange={setSelectedType}
            showYachts={cityHasYachts}
          />
          
          {/* Tier 3: Dynamic Quick Filters - only show when dates selected */}
          {hasDates && <QuickFilters assetType={selectedType} />}
        </div>
      </section>
      
      {/* Content Section */}
      <main className="flex-1 container px-6 py-8 md:py-10">
        {hasDates ? (
          <>
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
          </>
        ) : (
          /* No Dates Selected - Show Prompt */
          <div className="flex flex-col items-center text-center py-8 md:py-16">
            <div className="mb-8">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                <CalendarDays className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
                Select your travel dates
              </h2>
              <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
                Choose your dates to see available luxury stays, cars, and yachts for your trip
              </p>
            </div>
            
            {/* Featured Destinations */}
            <div className="w-full max-w-4xl">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                Featured Destinations
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {featuredDestinations.map((dest) => (
                  <button
                    key={dest.id}
                    onClick={() => handleDestinationClick(dest.id)}
                    className="group relative overflow-hidden rounded-xl aspect-[4/3] bg-secondary/30 hover:ring-2 hover:ring-accent transition-all"
                  >
                    <img 
                      src={dest.image} 
                      alt={dest.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                      <div className="flex items-center gap-1.5 text-white">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="font-medium">{dest.name}</span>
                      </div>
                      <span className="text-white/70 text-sm">{dest.state}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
