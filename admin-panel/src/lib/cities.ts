import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
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
// Fallback cities (current hardcoded data)
// ============================================

export const FALLBACK_CITIES: CityDoc[] = [
  { id: "aspen", name: "Aspen", state: "CO", hasYachts: false, locationKey: "Aspen, CO", sharedWith: [], sortOrder: 0, enabled: true },
  { id: "austin", name: "Austin", state: "TX", hasYachts: false, locationKey: "Austin, TX", sharedWith: [], sortOrder: 1, enabled: true },
  { id: "chicago", name: "Chicago", state: "IL", hasYachts: false, locationKey: "Chicago, IL", sharedWith: [], sortOrder: 2, enabled: true },
  { id: "connecticut", name: "Connecticut", state: "CT", hasYachts: false, locationKey: "Connecticut, CT", sharedWith: ["new-york", "new-jersey"], sortOrder: 3, enabled: true },
  { id: "fort-lauderdale", name: "Fort Lauderdale", state: "FL", hasYachts: true, locationKey: "Fort Lauderdale, FL", sharedWith: ["miami"], sortOrder: 4, enabled: true },
  { id: "las-vegas", name: "Las Vegas", state: "NV", hasYachts: false, locationKey: "Las Vegas, NV", sharedWith: [], sortOrder: 5, enabled: true },
  { id: "los-angeles", name: "Los Angeles", state: "CA", hasYachts: true, locationKey: "Los Angeles, CA", sharedWith: [], sortOrder: 6, enabled: true },
  { id: "miami", name: "Miami", state: "FL", hasYachts: true, locationKey: "Miami, FL", sharedWith: ["fort-lauderdale"], sortOrder: 7, enabled: true },
  { id: "nashville", name: "Nashville", state: "TN", hasYachts: false, locationKey: "Nashville, TN", sharedWith: [], sortOrder: 8, enabled: true },
  { id: "new-jersey", name: "New Jersey", state: "NJ", hasYachts: false, locationKey: "New Jersey, NJ", sharedWith: ["new-york", "connecticut"], sortOrder: 9, enabled: true },
  { id: "new-york", name: "New York City", state: "NY", hasYachts: true, locationKey: "New York City, NY", sharedWith: ["connecticut", "new-jersey"], sortOrder: 10, enabled: true },
  { id: "park-city", name: "Park City", state: "UT", hasYachts: false, locationKey: "Park City, UT", sharedWith: [], sortOrder: 11, enabled: true },
  { id: "scottsdale", name: "Scottsdale", state: "AZ", hasYachts: false, locationKey: "Scottsdale, AZ", sharedWith: [], sortOrder: 12, enabled: true },
  { id: "hamptons", name: "The Hamptons", state: "NY", hasYachts: true, locationKey: "The Hamptons, NY", sharedWith: [], sortOrder: 13, enabled: true },
];

// ============================================
// Real-time listener (returns ALL cities, including disabled)
// ============================================

export const subscribeToCities = (
  callback: (cities: CityDoc[]) => void
): (() => void) => {
  if (!db) {
    callback(FALLBACK_CITIES);
    return () => {};
  }

  const q = query(collection(db, "cities"), orderBy("name", "asc"));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback([]);
        return;
      }
      const cities: CityDoc[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
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
      });
      callback(cities);
    },
    (error) => {
      console.error("Error fetching cities:", error);
      callback([]);
    }
  );

  return unsubscribe;
};

// ============================================
// CRUD operations
// ============================================

export const addCity = async (city: Omit<CityDoc, "createdAt" | "updatedAt">) => {
  const ref = doc(db, "cities", city.id);
  await setDoc(ref, {
    ...city,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
};

export const updateCity = async (
  cityId: string,
  updates: Partial<Omit<CityDoc, "id" | "createdAt">>
) => {
  const ref = doc(db, "cities", cityId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteCity = async (cityId: string) => {
  const ref = doc(db, "cities", cityId);
  await deleteDoc(ref);
};

// ============================================
// Seed Firestore with default cities
// ============================================

export const seedCities = async (): Promise<number> => {
  const snapshot = await getDocs(collection(db, "cities"));
  if (!snapshot.empty) {
    throw new Error("Cities collection already has data. Clear it first to re-seed.");
  }

  let count = 0;
  for (const city of FALLBACK_CITIES) {
    const ref = doc(db, "cities", city.id);
    await setDoc(ref, {
      name: city.name,
      state: city.state,
      hasYachts: city.hasYachts,
      locationKey: city.locationKey,
      sharedWith: city.sharedWith,
      sortOrder: city.sortOrder,
      enabled: city.enabled,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    count++;
  }
  return count;
};

// ============================================
// Helper: derive unique market options from cities
// ============================================

export function getMarketOptions(cities: CityDoc[]): string[] {
  const keys = cities
    .filter((c) => c.enabled)
    .map((c) => c.locationKey);
  return [...new Set(keys)].sort();
}
