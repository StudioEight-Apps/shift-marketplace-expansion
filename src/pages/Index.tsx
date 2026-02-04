import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import Header from "@/components/shift/Header";
import Footer from "@/components/shift/Footer";
import HeroTagline from "@/components/shift/HeroTagline";
import AboutSection from "@/components/shift/AboutSection";
import WhyShiftSection from "@/components/shift/WhyShiftSection";
import { cities } from "@/components/shift/CitySelector";
import SearchPill from "@/components/shift/SearchPill";
import AssetTypeSelector from "@/components/shift/AssetTypeSelector";
import QuickFilters from "@/components/shift/QuickFilters";
import ListingsGrid from "@/components/shift/ListingsGrid";
import MobilePopularCarousel from "@/components/shift/MobilePopularCarousel";
import EmptyState from "@/components/shift/EmptyState";
import { villaListings, carListings, yachtListings } from "@/data/listings";
import { useSearch } from "@/context/SearchContext";
import { useIsMobile } from "@/hooks/use-mobile";
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

// Get popular listing titles by asset type
const getPopularHeading = (type: AssetType) => {
  return `Popular ${type}`;
};

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { cityId: searchCityId, startDate, endDate, setCityId, setSearchDates, hasDates } = useSearch();
  const [selectedCityId, setSelectedCityId] = useState(searchCityId || "");
  const [selectedType, setSelectedType] = useState<AssetType>("Stays");
  const isMobile = useIsMobile();

  // Parse dates from URL on mount
  useEffect(() => {
    const urlCity = searchParams.get("city");
    const urlType = searchParams.get("type");
    const urlCheckin = searchParams.get("checkin");
    const urlCheckout = searchParams.get("checkout");

    // Optional: hydrate asset type from URL when available
    const parsedType: AssetType | null = urlType
      ? urlType.toLowerCase() === "cars"
        ? "Cars"
        : urlType.toLowerCase() === "yachts"
          ? "Yachts"
          : urlType.toLowerCase() === "stays"
            ? "Stays"
            : null
      : null;

    if (parsedType) {
      setSelectedType(parsedType);
    }

    // Only hydrate city when the URL represents a complete, valid search.
    // This prevents "fresh" loads like /?city=miami (or partial dates) from preselecting a city.
    const isSingleDayUrl = parsedType === "Yachts";
    const hasValidUrlDates = isSingleDayUrl
      ? !!urlCheckin
      : !!(urlCheckin && urlCheckout);

    if (!hasValidUrlDates) return;

    // Hydrate dates
    try {
      const checkinDate = urlCheckin ? parseISO(urlCheckin) : null;
      const checkoutDate = !isSingleDayUrl && urlCheckout ? parseISO(urlCheckout) : null;
      if (checkinDate) {
        setSearchDates(checkinDate, checkoutDate);
      }
    } catch (e) {
      // Invalid dates, ignore
      return;
    }
    
    if (urlCity) {
      const city = cities.find(c => c.id === urlCity || c.name.toLowerCase() === urlCity.toLowerCase());
      if (city) {
        setSelectedCityId(city.id);
        setCityId(city.id);
      }
    }
  }, []);

  // Sync local city state with global search context
  useEffect(() => {
    setCityId(selectedCityId);
  }, [selectedCityId, setCityId]);

  const selectedCity = selectedCityId ? cities.find(c => c.id === selectedCityId) : null;
  // Show yachts by default (when no city selected), hide only for cities without yacht inventory
  const cityHasYachts = selectedCity ? (selectedCity.hasYachts ?? false) : true;

  // If city doesn't have yachts and Yachts is selected, switch to Stays
  useEffect(() => {
    if (!cityHasYachts && selectedType === "Yachts") {
      setSelectedType("Stays");
    }
  }, [cityHasYachts, selectedType]);

  // Reset end date when switching to single-day modes (Yachts only)
  useEffect(() => {
    if (selectedType === "Yachts") {
      setSearchDates(startDate, null);
    }
  }, [selectedType]);

  // Get all listings for current asset type (for popular/unfiltered view)
  const allListingsForType = useMemo(() => {
    switch (selectedType) {
      case "Cars":
        return carListings;
      case "Yachts":
        return yachtListings;
      case "Stays":
      default:
        return villaListings;
    }
  }, [selectedType]);

  // Get filtered listings (when dates are selected, filter by city)
  const filteredListings = useMemo(() => {
    const locationString = cityLocationMap[selectedCityId];
    if (locationString) {
      return allListingsForType.filter(l => l.location === locationString);
    }
    return allListingsForType;
  }, [selectedCityId, allListingsForType]);

  // Popular listings (show first 8 from all listings, no city filter)
  const popularListings = useMemo(() => {
    return allListingsForType.slice(0, 8);
  }, [allListingsForType]);

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
    params.set("type", selectedType.toLowerCase());
    if (selectedCityId) params.set("city", selectedCityId);
    if (startDate) params.set("checkin", format(startDate, "yyyy-MM-dd"));
    if (endDate) params.set("checkout", format(endDate, "yyyy-MM-dd"));
    
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-background scrollbar-dark flex flex-col">
      <Header />
      
      {/* Hero Tagline Section */}
      <HeroTagline />
      
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
          /* Filtered Results - After dates selected */
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {selectedType} in {selectedCity?.name || "Miami"}
              </h2>
              <span className="text-sm text-muted-foreground">
                {filteredListings.length} {filteredListings.length === 1 ? "listing" : "listings"}
              </span>
            </div>
            
            {filteredListings.length > 0 ? (
              <ListingsGrid 
                listings={filteredListings} 
                onListingClick={handleListingClick}
              />
            ) : (
              <EmptyState assetType={selectedType} city={selectedCity?.name || "Miami"} />
            )}
          </>
        ) : (
          /* No Dates Selected - Show Popular Listings */
          <>
            <div className="mb-4 md:mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {getPopularHeading(selectedType)}
              </h2>
            </div>
            
            {isMobile ? (
              <MobilePopularCarousel 
                listings={popularListings} 
                onListingClick={handleListingClick}
              />
            ) : (
              <ListingsGrid 
                listings={popularListings} 
                onListingClick={handleListingClick}
              />
            )}
          </>
        )}
      </main>

      {/* About & Why Shift Sections - only show when no dates selected */}
      {!hasDates && (
        <>
          <AboutSection />
          <WhyShiftSection />
        </>
      )}

      <Footer />
    </div>
  );
};

export default Index;
