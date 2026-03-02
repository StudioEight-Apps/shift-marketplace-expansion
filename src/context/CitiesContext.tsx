import React, { createContext, useContext, useEffect, useState } from "react";
import {
  CityDoc,
  FALLBACK_CITIES,
  subscribeToCities,
  getLocationKeysForCity,
} from "@/lib/cities";

interface CitiesContextValue {
  cities: CityDoc[];
  loading: boolean;
  /** Get all location keys for a city (including shared cities' keys) */
  getCityLocationKeys: (cityId: string) => string[];
}

const CitiesContext = createContext<CitiesContextValue>({
  cities: FALLBACK_CITIES,
  loading: true,
  getCityLocationKeys: () => [],
});

export const useCities = () => useContext(CitiesContext);

export const CitiesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cities, setCities] = useState<CityDoc[]>(FALLBACK_CITIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToCities((fetched) => {
      setCities(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getCityLocationKeys = (cityId: string): string[] => {
    return getLocationKeysForCity(cityId, cities);
  };

  return (
    <CitiesContext.Provider value={{ cities, loading, getCityLocationKeys }}>
      {children}
    </CitiesContext.Provider>
  );
};
