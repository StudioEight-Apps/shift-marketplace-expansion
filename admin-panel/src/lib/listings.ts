import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ============================================
// FIRESTORE COLLECTION TYPES
// ============================================

export interface Villa {
  id: string;
  name: string;
  description: string;
  pricePerNight: number;
  cleaningFee: number;
  depositAmount: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  amenities: string[];

  // Photo uploads
  images: string[]; // Array of Firebase Storage URLs
  mainImageUrl: string | null; // First image is main

  // Location details
  market: string; // User-facing city (e.g., "Miami, FL")
  address: string; // Full street address
  city: string; // Can be auto-filled from geocoding
  neighborhood: string;
  state: string;
  zipCode: string;
  lat: number | null; // Derived from geocoding, can be null
  lng: number | null; // Derived from geocoding, can be null
  location: string; // Computed display field (derived from market)

  // Source tracking
  sourceType: "shift_fleet" | "pms" | "api";
  sourceName: string; // "shift" for internal, PMS name, or API provider
  externalId: string | null;
  syncStatus: "n/a" | "ok" | "stale" | "error";
  lastSyncedAt: string | null; // ISO timestamp
  readOnlyCalendar: boolean; // true for PMS/API sources

  // Availability
  blockedDates: string[];
  minimumStay: number;

  // Admin controls
  status: "active" | "hidden";
  featured: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface Car {
  id: string;
  name: string;
  brand: string;
  model?: string;
  location: string;
  description: string;
  pricePerDay: number;
  depositAmount: number;
  bodyStyle: string;
  seats: number;
  images: string[];

  // Provider tracking
  provider: string;
  providerId: string;
  source: "api" | "manual";

  // Availability
  blockedDates: string[];

  // Admin controls
  status: "active" | "hidden";
  featured: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface Yacht {
  id: string;
  name: string;
  length: number;
  location: string;
  description: string;
  pricePerHour: number;
  depositAmount: number;
  maxGuests: number;
  captainIncluded: boolean;
  amenities: string[];
  images: string[];

  // Provider tracking
  provider: string;
  providerId: string;
  source: "api" | "manual";

  // Availability
  blockedDates: string[];

  // Admin controls
  status: "active" | "hidden";
  featured: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// VILLA FUNCTIONS
// ============================================

export const getVillas = (
  callback: (villas: Villa[]) => void,
  filters?: { location?: string; status?: "active" | "hidden"; featured?: boolean }
) => {
  if (!db) return () => {};

  let q = query(collection(db, "villas"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    let villas: Villa[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "",
        description: data.description || "",
        pricePerNight: data.pricePerNight || 0,
        cleaningFee: data.cleaningFee || 0,
        depositAmount: data.depositAmount || 0,
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 0,
        maxGuests: data.maxGuests || 0,
        amenities: data.amenities || [],
        images: data.images || [],
        mainImageUrl: data.mainImageUrl || (data.images && data.images[0]) || null,
        market: data.market || "",
        address: data.address || "",
        city: data.city || "",
        neighborhood: data.neighborhood || "",
        state: data.state || "",
        zipCode: data.zipCode || "",
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        location: data.location || data.market || "",
        sourceType: data.sourceType || "shift_fleet",
        sourceName: data.sourceName || "shift",
        externalId: data.externalId || null,
        syncStatus: data.syncStatus || "n/a",
        lastSyncedAt: data.lastSyncedAt || null,
        readOnlyCalendar: data.readOnlyCalendar || false,
        blockedDates: data.blockedDates || [],
        minimumStay: data.minimumStay || 1,
        status: data.status || "active",
        featured: data.featured || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    // Apply filters client-side
    if (filters?.location) {
      villas = villas.filter((v) => v.location === filters.location);
    }
    if (filters?.status) {
      villas = villas.filter((v) => v.status === filters.status);
    }
    if (filters?.featured !== undefined) {
      villas = villas.filter((v) => v.featured === filters.featured);
    }

    callback(villas);
  });

  return unsubscribe;
};

export const getVillaById = async (id: string): Promise<Villa | null> => {
  if (!db) return null;
  const docRef = doc(db, "villas", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name || "",
    description: data.description || "",
    pricePerNight: data.pricePerNight || 0,
    cleaningFee: data.cleaningFee || 0,
    bedrooms: data.bedrooms || 0,
    bathrooms: data.bathrooms || 0,
    maxGuests: data.maxGuests || 0,
    amenities: data.amenities || [],
    images: data.images || [],
    mainImageUrl: data.mainImageUrl || (data.images && data.images[0]) || null,
    market: data.market || "",
    address: data.address || "",
    city: data.city || "",
    neighborhood: data.neighborhood || "",
    state: data.state || "",
    zipCode: data.zipCode || "",
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    location: data.location || data.market || "",
    sourceType: data.sourceType || "shift_fleet",
    sourceName: data.sourceName || "shift",
    externalId: data.externalId || null,
    syncStatus: data.syncStatus || "n/a",
    lastSyncedAt: data.lastSyncedAt || null,
    readOnlyCalendar: data.readOnlyCalendar || false,
    blockedDates: data.blockedDates || [],
    minimumStay: data.minimumStay || 1,
    status: data.status || "active",
    featured: data.featured || false,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

export const addVilla = async (villa: Omit<Villa, "id" | "createdAt" | "updatedAt">) => {
  if (!db) throw new Error("Firestore not configured");
  const docRef = await addDoc(collection(db, "villas"), {
    ...villa,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateVilla = async (id: string, updates: Partial<Villa>) => {
  if (!db) throw new Error("Firestore not configured");
  await updateDoc(doc(db, "villas", id), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteVilla = async (id: string) => {
  if (!db) throw new Error("Firestore not configured");
  await deleteDoc(doc(db, "villas", id));
};

// ============================================
// CAR FUNCTIONS
// ============================================

export const getCars = (
  callback: (cars: Car[]) => void,
  filters?: { location?: string; status?: "active" | "hidden"; featured?: boolean }
) => {
  if (!db) return () => {};

  const unsubscribe = onSnapshot(collection(db, "cars"), (snapshot) => {
    let cars: Car[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "",
        brand: data.brand || "",
        model: data.model || "",
        location: data.location || "",
        description: data.description || "",
        pricePerDay: data.pricePerDay || 0,
        depositAmount: data.depositAmount || 0,
        bodyStyle: data.bodyStyle || "",
        seats: data.seats || 0,
        images: data.images || [],
        provider: data.provider || "shift_fleet",
        providerId: data.providerId || "",
        source: data.source || "manual",
        blockedDates: data.blockedDates || [],
        status: data.status || "active",
        featured: data.featured || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    // Apply filters client-side
    if (filters?.location) {
      cars = cars.filter((c) => c.location === filters.location);
    }
    if (filters?.status) {
      cars = cars.filter((c) => c.status === filters.status);
    }
    if (filters?.featured !== undefined) {
      cars = cars.filter((c) => c.featured === filters.featured);
    }

    callback(cars);
  });

  return unsubscribe;
};

export const getCarById = async (id: string): Promise<Car | null> => {
  if (!db) return null;
  const docRef = doc(db, "cars", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name || "",
    brand: data.brand || "",
    model: data.model || "",
    location: data.location || "",
    description: data.description || "",
    pricePerDay: data.pricePerDay || 0,
    bodyStyle: data.bodyStyle || "",
    seats: data.seats || 0,
    images: data.images || [],
    provider: data.provider || "shift_fleet",
    providerId: data.providerId || "",
    source: data.source || "manual",
    blockedDates: data.blockedDates || [],
    status: data.status || "active",
    featured: data.featured || false,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

export const addCar = async (car: Omit<Car, "id" | "createdAt" | "updatedAt">) => {
  if (!db) throw new Error("Firestore not configured");
  const docRef = await addDoc(collection(db, "cars"), {
    ...car,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateCar = async (id: string, updates: Partial<Car>) => {
  if (!db) throw new Error("Firestore not configured");
  await updateDoc(doc(db, "cars", id), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteCar = async (id: string) => {
  if (!db) throw new Error("Firestore not configured");
  await deleteDoc(doc(db, "cars", id));
};

// ============================================
// YACHT FUNCTIONS
// ============================================

export const getYachts = (
  callback: (yachts: Yacht[]) => void,
  filters?: { location?: string; status?: "active" | "hidden"; featured?: boolean }
) => {
  if (!db) return () => {};

  const unsubscribe = onSnapshot(collection(db, "yachts"), (snapshot) => {
    let yachts: Yacht[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "",
        length: data.length || 0,
        location: data.location || "",
        description: data.description || "",
        pricePerHour: data.pricePerHour || 0,
        depositAmount: data.depositAmount || 0,
        maxGuests: data.maxGuests || 0,
        captainIncluded: data.captainIncluded ?? data.crewIncluded ?? true,
        amenities: data.amenities || [],
        images: data.images || [],
        provider: data.provider || "shift_fleet",
        providerId: data.providerId || "",
        source: data.source || "manual",
        blockedDates: data.blockedDates || [],
        status: data.status || "active",
        featured: data.featured || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    // Apply filters client-side
    if (filters?.location) {
      yachts = yachts.filter((y) => y.location === filters.location);
    }
    if (filters?.status) {
      yachts = yachts.filter((y) => y.status === filters.status);
    }
    if (filters?.featured !== undefined) {
      yachts = yachts.filter((y) => y.featured === filters.featured);
    }

    callback(yachts);
  });

  return unsubscribe;
};

export const getYachtById = async (id: string): Promise<Yacht | null> => {
  if (!db) return null;
  const docRef = doc(db, "yachts", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name || "",
    length: data.length || 0,
    location: data.location || "",
    description: data.description || "",
    pricePerHour: data.pricePerHour || 0,
    maxGuests: data.maxGuests || 0,
    captainIncluded: data.captainIncluded ?? data.crewIncluded ?? true,
    amenities: data.amenities || [],
    images: data.images || [],
    provider: data.provider || "shift_fleet",
    providerId: data.providerId || "",
    source: data.source || "manual",
    blockedDates: data.blockedDates || [],
    status: data.status || "active",
    featured: data.featured || false,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

export const addYacht = async (yacht: Omit<Yacht, "id" | "createdAt" | "updatedAt">) => {
  if (!db) throw new Error("Firestore not configured");
  const docRef = await addDoc(collection(db, "yachts"), {
    ...yacht,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateYacht = async (id: string, updates: Partial<Yacht>) => {
  if (!db) throw new Error("Firestore not configured");
  await updateDoc(doc(db, "yachts", id), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteYacht = async (id: string) => {
  if (!db) throw new Error("Firestore not configured");
  await deleteDoc(doc(db, "yachts", id));
};

// Admin panel doesn't need the UI conversion helpers
