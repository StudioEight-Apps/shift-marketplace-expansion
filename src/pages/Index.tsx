import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import Header from "@/components/shift/Header";
import Footer from "@/components/shift/Footer";
import HeroTagline from "@/components/shift/HeroTagline";
import AboutSection from "@/components/shift/AboutSection";
import WhyShiftSection from "@/components/shift/WhyShiftSection";
import { cities } from "@/components/shift/CitySelector";
import SearchPill from "@/components/shift/SearchPill";
import AssetTypeSelector from "@/components/shift/AssetTypeSelector";
import QuickFilters, { type FilterState } from "@/components/shift/QuickFilters";
import ListingsGrid from "@/components/shift/ListingsGrid";
import MobilePopularCarousel from "@/components/shift/MobilePopularCarousel";
import EmptyState from "@/components/shift/EmptyState";
import { useSearch } from "@/context/SearchContext";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Listing } from "@/components/shift/ListingCard";
import {
  getVillas,
  getCars,
  getYachts,
  villaToListing,
  carToListing,
  yachtToListing,
  Villa,
  Car,
  Yacht,
} from "@/lib/listings";

type AssetType = "Stays" | "Cars" | "Yachts";
type SortOption = "default" | "price-high" | "price-low" | "size-high" | "size-low";

// Sort options per asset type — keeps each experience relevant
const sortOptionsForType: Record<AssetType, SortOption[]> = {
  Stays: ["default", "price-high", "price-low"],
  Cars: ["default", "price-high", "price-low"],
  Yachts: ["default", "price-high", "price-low", "size-high", "size-low"],
};

const allSortLabels: Record<SortOption, string> = {
  "default": "Recommended",
  "price-high": "Price: High to Low",
  "price-low": "Price: Low to High",
  "size-high": "Size: Largest First",
  "size-low": "Size: Smallest First",
};

// Map city IDs to location strings used in listings data
const cityLocationMap: Record<string, string> = {
  "miami": "Miami, FL",
  "los-angeles": "Los Angeles, CA",
  "new-york": "New York City, NY",
  "las-vegas": "Las Vegas, NV",
  "scottsdale": "Scottsdale, AZ",
  "aspen": "Aspen, CO",
  "austin": "Austin, TX",
  "chicago": "Chicago, IL",
  "nashville": "Nashville, TN",
  "hamptons": "The Hamptons, NY",
  "park-city": "Park City, UT",
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
  const [quickFilters, setQuickFilters] = useState<FilterState | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const isMobile = useIsMobile();

  // Firestore data state
  const [villas, setVillas] = useState<Villa[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch listings from Firestore
  useEffect(() => {
    const unsubVillas = getVillas((data) => {
      setVillas(data.filter(v => v.status === "active"));
      setLoading(false);
    });
    const unsubCars = getCars((data) => {
      setCars(data.filter(c => c.status === "active"));
    });
    const unsubYachts = getYachts((data) => {
      setYachts(data.filter(y => y.status === "active"));
    });

    return () => {
      unsubVillas();
      unsubCars();
      unsubYachts();
    };
  }, []);

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
  // Also reset sort if current sort isn't valid for the new asset type
  useEffect(() => {
    if (selectedType === "Yachts") {
      setSearchDates(startDate, null);
    }
    const validSorts = sortOptionsForType[selectedType];
    if (!validSorts.includes(sortBy)) {
      setSortBy("default");
    }
  }, [selectedType]);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    if (!sortDropdownOpen) return;
    const handleClick = () => setSortDropdownOpen(false);
    const timer = setTimeout(() => document.addEventListener("click", handleClick), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClick);
    };
  }, [sortDropdownOpen]);

  // Convert Firestore data to UI Listing format
  const villaListings = useMemo(() => villas.map(villaToListing), [villas]);
  const carListings = useMemo(() => cars.map(carToListing), [cars]);
  const yachtListings = useMemo(() => yachts.map(yachtToListing), [yachts]);

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
  }, [selectedType, villaListings, carListings, yachtListings]);

  // Get filtered listings (when dates are selected, filter by city AND availability)
  const filteredListings = useMemo(() => {
    let filtered = allListingsForType;

    // Filter by city
    const locationString = cityLocationMap[selectedCityId];
    if (locationString) {
      filtered = filtered.filter(l => l.location === locationString);
    }

    // Filter by availability (if dates selected)
    if (hasDates && startDate && endDate) {
      filtered = filtered.filter(listing => {
        // Get the source data (villa/car/yacht) to check blockedDates
        let blockedDates: string[] = [];

        if (listing.assetType === "Stays") {
          const villa = villas.find(v => v.id === listing.id);
          blockedDates = villa?.blockedDates || [];
        } else if (listing.assetType === "Cars") {
          const car = cars.find(c => c.id === listing.id);
          blockedDates = car?.blockedDates || [];
        } else if (listing.assetType === "Yachts") {
          const yacht = yachts.find(y => y.id === listing.id);
          blockedDates = yacht?.blockedDates || [];
        }

        // Check if any date in the selected range is blocked
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateString = currentDate.toISOString().split("T")[0];
          if (blockedDates.includes(dateString)) {
            return false; // This listing is not available
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        return true; // No blocked dates found, listing is available
      });
    }

    // Apply quick filters (price, guests, beds, brand, bodyStyle, length)
    if (quickFilters) {
      // Price filter
      if (quickFilters.price) {
        const [minPrice, maxPrice] = quickFilters.price;
        filtered = filtered.filter(l => {
          if (maxPrice >= 10000) return l.price >= minPrice;
          return l.price >= minPrice && l.price <= maxPrice;
        });
      }

      // Guests filter (minimum)
      if (quickFilters.guests !== null) {
        filtered = filtered.filter(l => l.guests >= quickFilters.guests!);
      }

      // Beds filter (minimum, stays only)
      if (quickFilters.beds !== null) {
        filtered = filtered.filter(l => (l.bedrooms ?? 0) >= quickFilters.beds!);
      }

      // Brand filter (cars only)
      if (quickFilters.brand.length > 0) {
        filtered = filtered.filter(l => l.brand && quickFilters.brand.includes(l.brand));
      }

      // Body style filter (cars only)
      if (quickFilters.bodyStyle.length > 0) {
        filtered = filtered.filter(l => l.bodyStyle && quickFilters.bodyStyle.includes(l.bodyStyle));
      }

      // Length filter (yachts only)
      if (quickFilters.length) {
        const [minLen, maxLen] = quickFilters.length;
        filtered = filtered.filter(l => {
          const len = l.length ?? 0;
          if (maxLen >= 150) return len >= minLen;
          return len >= minLen && len <= maxLen;
        });
      }
    }

    // Apply sorting
    if (sortBy !== "default") {
      filtered = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case "price-high": return b.price - a.price;
          case "price-low": return a.price - b.price;
          case "size-high": return (b.length ?? 0) - (a.length ?? 0);
          case "size-low": return (a.length ?? 0) - (b.length ?? 0);
          default: return 0;
        }
      });
    }

    return filtered;
  }, [selectedCityId, allListingsForType, hasDates, startDate, endDate, villas, cars, yachts, quickFilters, sortBy]);

  // Popular listings (show only featured listings, filtered by city, up to 8)
  const popularListings = useMemo(() => {
    let popular = allListingsForType.filter(l => l.badges.includes("Guest Favorite"));
    const locationString = cityLocationMap[selectedCityId];
    if (locationString) {
      popular = popular.filter(l => l.location === locationString);
    }
    let result = popular.slice(0, 8);
    // Apply sorting to popular listings too
    if (sortBy !== "default") {
      result = [...result].sort((a, b) => {
        switch (sortBy) {
          case "price-high": return b.price - a.price;
          case "price-low": return a.price - b.price;
          case "size-high": return (b.length ?? 0) - (a.length ?? 0);
          case "size-low": return (a.length ?? 0) - (b.length ?? 0);
          default: return 0;
        }
      });
    }
    return result;
  }, [allListingsForType, selectedCityId, sortBy]);

  // Get sort options for current asset type
  const currentSortOptions = sortOptionsForType[selectedType];

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

      {/* Hero Section */}
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
          {hasDates && <QuickFilters assetType={selectedType} onFiltersChange={setQuickFilters} />}
        </div>
      </section>
      
      {/* Content Section */}
      <main className="flex-1 container px-6 py-8 md:py-10">
        {loading ? (
          /* Loading State */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-sm text-muted-foreground">Loading listings...</p>
          </div>
        ) : hasDates ? (
          /* Filtered Results - After dates selected */
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {selectedType} in {selectedCity?.name || "Miami"}
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {filteredListings.length} {filteredListings.length === 1 ? "listing" : "listings"}
                </span>
                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                    className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{allSortLabels[sortBy]}</span>
                    <span className="sm:hidden">Sort</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </button>
                  {sortDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border-subtle rounded-md shadow-md z-50 py-1">
                      {currentSortOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSortBy(option);
                            setSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                            sortBy === option
                              ? "bg-foreground/10 text-foreground font-medium"
                              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                          }`}
                        >
                          {allSortLabels[option]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {filteredListings.length > 0 ? (
              <ListingsGrid
                listings={filteredListings}
                onListingClick={handleListingClick}
                compact={isMobile}
              />
            ) : (
              <EmptyState assetType={selectedType} city={selectedCity?.name || "Miami"} />
            )}
          </>
        ) : (
          /* No Dates Selected - Show Popular Listings */
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {getPopularHeading(selectedType)}
              </h2>
              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{allSortLabels[sortBy]}</span>
                  <span className="sm:hidden">Sort</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </button>
                {sortDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border-subtle rounded-md shadow-md z-50 py-1">
                    {currentSortOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSortBy(option);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                          sortBy === option
                            ? "bg-foreground/10 text-foreground font-medium"
                            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        }`}
                      >
                        {allSortLabels[option]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {popularListings.length > 0 ? (
              isMobile ? (
                <MobilePopularCarousel
                  listings={popularListings}
                  onListingClick={handleListingClick}
                />
              ) : (
                <ListingsGrid
                  listings={popularListings}
                  onListingClick={handleListingClick}
                />
              )
            ) : (
              <EmptyState assetType={selectedType} city={selectedCity?.name || "your area"} />
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
