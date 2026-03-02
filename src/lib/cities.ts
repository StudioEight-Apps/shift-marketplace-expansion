import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ============================================
// City document schema (Firestore `cities` collection)
// ============================================

export interface CityDoc {
  id: string;
  name: string;
  state: string;
  hasYachts: boolean;
  /** Location string that matches inventory location/market fields, e.g. "Miami, FL" */
  locationKey: string;
  /** Other city IDs whose inventory should also appear when browsing this city */
  sharedWith: string[];
  sortOrder: number;
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================
// Fallback cities (current hardcoded data — used if Firestore fails)
// ============================================

export const FALLBACK_CITIES: CityDoc[] = [
  { id: "aspen", name: "Aspen", state: "CO", hasYachts: false, locationKey: "Aspen, CO", sharedWith: [], sortOrder: 0, enabled: true },
  { id: "austin", name: "Austin", state: "TX", hasYachts: false, locationKey: "Austin, TX", sharedWith: [], sortOrder: 1, enabled: true },
  { id: "chicago", name: "Chicago", state: "IL", hasYachts: false, locationKey: "Chicago, IL", sharedWith: [], sortOrder: 2, enabled: true },
  { id: "connecticut", name: "Connecticut", state: "CT", hasYachts: false, locationKey: "Connecticut, CT", sharedWith: ["new-york", "new-jersey"], sortOrder: 3, enabled: true },
  { id: "fort-lauderdale", name: "Fort Lauderdale", state: "FL", hasYachts: true, locationKey: "Fort Lauderdale, FL", sharedWith: ["miami"], sortOrder: 4, enabled: true },
  { id: "hamptons", name: "The Hamptons", state: "NY", hasYachts: true, locationKey: "The Hamptons, NY", sharedWith: [], sortOrder: 5, enabled: true },
  { id: "las-vegas", name: "Las Vegas", state: "NV", hasYachts: false, locationKey: "Las Vegas, NV", sharedWith: [], sortOrder: 6, enabled: true },
  { id: "los-angeles", name: "Los Angeles", state: "CA", hasYachts: true, locationKey: "Los Angeles, CA", sharedWith: [], sortOrder: 7, enabled: true },
  { id: "miami", name: "Miami", state: "FL", hasYachts: true, locationKey: "Miami, FL", sharedWith: ["fort-lauderdale"], sortOrder: 8, enabled: true },
  { id: "nashville", name: "Nashville", state: "TN", hasYachts: false, locationKey: "Nashville, TN", sharedWith: [], sortOrder: 9, enabled: true },
  { id: "new-jersey", name: "New Jersey", state: "NJ", hasYachts: false, locationKey: "New Jersey, NJ", sharedWith: ["new-york", "connecticut"], sortOrder: 10, enabled: true },
  { id: "new-york", name: "New York City", state: "NY", hasYachts: true, locationKey: "New York City, NY", sharedWith: ["connecticut", "new-jersey"], sortOrder: 11, enabled: true },
  { id: "park-city", name: "Park City", state: "UT", hasYachts: false, locationKey: "Park City, UT", sharedWith: [], sortOrder: 12, enabled: true },
  { id: "scottsdale", name: "Scottsdale", state: "AZ", hasYachts: false, locationKey: "Scottsdale, AZ", sharedWith: [], sortOrder: 13, enabled: true },
];

// ============================================
// Real-time Firestore listener
// ============================================

export const subscribeToCities = (
  callback: (cities: CityDoc[]) => void
): (() => void) => {
  if (!db) {
    callback(FALLBACK_CITIES);
    return () => {};
  }

  const q = query(collection(db, "cities"), orderBy("sortOrder", "asc"));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        // Collection doesn't exist yet — use fallback
        callback(FALLBACK_CITIES);
        return;
      }
      const cities: CityDoc[] = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            state: data.state,
            hasYachts: data.hasYachts ?? false,
            locationKey: data.locationKey,
            sharedWith: data.sharedWith || [],
            sortOrder: data.sortOrder ?? 0,
            enabled: data.enabled ?? true,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as CityDoc;
        })
        .filter((c) => c.enabled);
      callback(cities.length > 0 ? cities : FALLBACK_CITIES);
    },
    (error) => {
      console.error("Error fetching cities:", error);
      callback(FALLBACK_CITIES);
    }
  );

  return unsubscribe;
};

// ============================================
// Helper: Resolve all location keys for a city (including shared)
// ============================================

export function getLocationKeysForCity(
  cityId: string,
  allCities: CityDoc[]
): string[] {
  const city = allCities.find((c) => c.id === cityId);
  if (!city) return [];

  const keys = [city.locationKey];
  for (const sharedId of city.sharedWith) {
    const shared = allCities.find((c) => c.id === sharedId);
    if (shared) keys.push(shared.locationKey);
  }
  return [...new Set(keys)];
}
