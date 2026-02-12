import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

// ============================================
// FIRESTORE COLLECTION TYPES
// ============================================

export interface Villa {
  id: string;
  name: string;
  location: string;
  description: string;
  pricePerNight: number;
  cleaningFee: number;
  depositAmount: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  amenities: string[];
  images: string[];

  // Provider tracking
  provider: string;
  providerId: string;
  source: "api" | "manual";

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
  model: string;
  location: string;
  description: string;
  pricePerDay: number;
  depositAmount: number;
  bodyStyle: string;
  seats: number;
  power: string;
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
  crewIncluded: boolean;
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

export interface BookingRequest {
  id: string;
  assetType: "villa" | "car" | "yacht";
  assetId: string;
  assetName: string;

  // Guest details
  guestName: string;
  guestEmail: string;
  guestPhone: string;

  // Booking details
  checkIn: Date;
  checkOut: Date;
  guests: number;

  // For yachts
  hours?: number;

  // Status
  status: "pending" | "approved" | "denied";

  // Notes
  guestNotes?: string;
  adminNotes?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
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
        location: data.location || "",
        description: data.description || "",
        pricePerNight: data.pricePerNight || 0,
        cleaningFee: data.cleaningFee || 0,
        depositAmount: data.depositAmount || 0,
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 0,
        maxGuests: data.maxGuests || 0,
        amenities: data.amenities || [],
        images: data.images || [],
        provider: data.provider || "shift_fleet",
        providerId: data.providerId || "",
        source: data.source || "manual",
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
    location: data.location || "",
    description: data.description || "",
    pricePerNight: data.pricePerNight || 0,
    cleaningFee: data.cleaningFee || 0,
    depositAmount: data.depositAmount || 0,
    bedrooms: data.bedrooms || 0,
    bathrooms: data.bathrooms || 0,
    maxGuests: data.maxGuests || 0,
    amenities: data.amenities || [],
    images: data.images || [],
    provider: data.provider || "shift_fleet",
    providerId: data.providerId || "",
    source: data.source || "manual",
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
        power: data.power || "",
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
    depositAmount: data.depositAmount || 0,
    bodyStyle: data.bodyStyle || "",
    seats: data.seats || 0,
    power: data.power || "",
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
        crewIncluded: data.crewIncluded ?? true,
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
    depositAmount: data.depositAmount || 0,
    maxGuests: data.maxGuests || 0,
    crewIncluded: data.crewIncluded ?? true,
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

// ============================================
// HELPER: Convert Firestore listings to UI format
// ============================================

import { Listing } from "@/components/shift/ListingCard";

export const villaToListing = (villa: Villa): Listing => ({
  id: villa.id,
  title: villa.name,
  location: villa.location,
  guests: villa.maxGuests,
  bedrooms: villa.bedrooms,
  rating: 0, // No ratings yet
  price: villa.pricePerNight,
  cleaningFee: villa.cleaningFee || 0,
  depositAmount: villa.depositAmount || 0,
  priceUnit: "per day",
  image: villa.images[0] || "",
  images: villa.images,
  attributes: villa.amenities, // Show all amenities instead of slicing to 3
  badges: villa.featured ? ["Guest Favorite"] : [],
  assetType: "Stays",
});

export const carToListing = (car: Car): Listing => ({
  id: car.id,
  title: car.name,
  location: car.location,
  guests: car.seats,
  brand: car.brand,
  seats: car.seats,
  bodyStyle: car.bodyStyle,
  power: car.power,
  rating: 0, // No ratings yet
  price: car.pricePerDay,
  depositAmount: car.depositAmount || 0,
  priceUnit: "per day",
  image: car.images[0] || "",
  images: car.images,
  attributes: [car.bodyStyle, car.power, "Luxury"].filter(Boolean),
  badges: car.featured ? ["Guest Favorite"] : [],
  assetType: "Cars",
});

export const yachtToListing = (yacht: Yacht): Listing => ({
  id: yacht.id,
  title: yacht.name,
  location: yacht.location,
  guests: yacht.maxGuests,
  length: yacht.length,
  rating: 0, // No ratings yet
  price: yacht.pricePerHour,
  depositAmount: yacht.depositAmount || 0,
  priceUnit: "per hour",
  image: yacht.images[0] || "",
  images: yacht.images,
  attributes: yacht.amenities, // Show all amenities instead of slicing to 3
  badges: yacht.featured ? ["Guest Favorite"] : [],
  assetType: "Yachts",
});

// ============================================
// BOOKING REQUEST FUNCTIONS
// ============================================

export const getBookingRequests = (
  callback: (requests: BookingRequest[]) => void,
  filters?: { status?: "pending" | "approved" | "denied"; assetType?: string }
) => {
  if (!db) return () => {};

  let q = query(collection(db, "bookingRequests"), orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    let requests: BookingRequest[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        assetType: data.assetType || "villa",
        assetId: data.assetId || "",
        assetName: data.assetName || "",
        guestName: data.guestName || "",
        guestEmail: data.guestEmail || "",
        guestPhone: data.guestPhone || "",
        checkIn: data.checkIn?.toDate() || new Date(),
        checkOut: data.checkOut?.toDate() || new Date(),
        guests: data.guests || 0,
        hours: data.hours,
        status: data.status || "pending",
        guestNotes: data.guestNotes,
        adminNotes: data.adminNotes,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        reviewedAt: data.reviewedAt?.toDate(),
        reviewedBy: data.reviewedBy,
      };
    });

    // Apply filters
    if (filters?.status) {
      requests = requests.filter((r) => r.status === filters.status);
    }
    if (filters?.assetType) {
      requests = requests.filter((r) => r.assetType === filters.assetType);
    }

    callback(requests);
  });

  return unsubscribe;
};

export const createBookingRequest = async (
  request: Omit<BookingRequest, "id" | "createdAt" | "updatedAt" | "status">
) => {
  if (!db) throw new Error("Firestore not configured");
  const docRef = await addDoc(collection(db, "bookingRequests"), {
    ...request,
    status: "pending",
    checkIn: Timestamp.fromDate(request.checkIn),
    checkOut: Timestamp.fromDate(request.checkOut),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Sync to GoHighLevel CRM (fire-and-forget — don't block the user)
  syncToGHL({
    bookingId: docRef.id,
    guestName: request.guestName,
    guestEmail: request.guestEmail,
    guestPhone: request.guestPhone,
    assetType: request.assetType,
    assetName: request.assetName,
    checkIn: request.checkIn.toISOString(),
    checkOut: request.checkOut.toISOString(),
    guests: request.guests,
    hours: request.hours,
    guestNotes: request.guestNotes,
  }).catch((err) => console.error("GHL sync failed (non-blocking):", err));

  return docRef.id;
};

// ── GoHighLevel CRM sync ────────────────────────────────────────────────
async function syncToGHL(data: Record<string, unknown>) {
  const baseUrl = window.location.hostname === "localhost"
    ? ""
    : "https://adoring-ptolemy.vercel.app";
  const res = await fetch(`${baseUrl}/api/ghl-sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GHL sync HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

export const approveBookingRequest = async (requestId: string, adminNotes?: string) => {
  if (!db) throw new Error("Firestore not configured");

  // Get the booking request
  const requestDoc = await getDoc(doc(db, "bookingRequests", requestId));
  if (!requestDoc.exists()) throw new Error("Booking request not found");

  const request = requestDoc.data();

  // Update request status
  await updateDoc(doc(db, "bookingRequests", requestId), {
    status: "approved",
    adminNotes,
    reviewedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Block dates on the asset
  const { assetType, assetId, checkIn, checkOut } = request;
  const startDate = checkIn.toDate();
  const endDate = checkOut.toDate();

  // Generate array of date strings to block
  const datesToBlock: string[] = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    datesToBlock.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Determine which collection to update
  let collectionName = "";
  if (assetType === "villa") collectionName = "villas";
  else if (assetType === "car") collectionName = "cars";
  else if (assetType === "yacht") collectionName = "yachts";

  if (!collectionName) throw new Error("Invalid asset type");

  // Get current blocked dates
  const assetDoc = await getDoc(doc(db, collectionName, assetId));
  if (!assetDoc.exists()) throw new Error("Asset not found");

  const currentBlockedDates = assetDoc.data().blockedDates || [];
  const updatedBlockedDates = [...new Set([...currentBlockedDates, ...datesToBlock])];

  // Update asset with new blocked dates
  await updateDoc(doc(db, collectionName, assetId), {
    blockedDates: updatedBlockedDates,
    updatedAt: Timestamp.now(),
  });
};

export const denyBookingRequest = async (requestId: string, adminNotes?: string) => {
  if (!db) throw new Error("Firestore not configured");

  await updateDoc(doc(db, "bookingRequests", requestId), {
    status: "denied",
    adminNotes,
    reviewedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
};
