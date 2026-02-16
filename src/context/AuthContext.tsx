import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// Booking item details
export interface BookingVilla {
  id?: string;
  name: string;
  image?: string;
  checkIn: Date;
  checkOut: Date;
  price: number;
  pricePerNight: number;
  nights: number;
  location: string;
}

export interface BookingCar {
  id?: string;
  name: string;
  image?: string;
  location?: string;
  pickupDate: Date;
  dropoffDate: Date;
  price: number;
  pricePerDay: number;
  days: number;
}

export interface BookingYacht {
  id?: string;
  name: string;
  image?: string;
  location?: string;
  date: Date;
  startTime: string;
  endTime: string;
  price: number;
  pricePerHour: number;
  hours: number;
}

export interface BookingRequest {
  id: string;
  status: "Pending" | "Contacted" | "Confirmed" | "Cancelled" | "Approved" | "Partial" | "Declined" | "Completed";
  createdAt: Date;
  customer: {
    uid: string;
    name: string;
    email: string;
    phone: string;
  };
  villa: BookingVilla | null;
  car: BookingCar | null;
  yacht: BookingYacht | null;
  grandTotal: number;
}

/** Derive overall booking status from per-item statuses (matches admin panel logic) */
function deriveStatus(data: any): BookingRequest["status"] {
  const statuses: string[] = [];
  if (data.villa) statuses.push(data.villa.status || "Pending");
  if (data.car) statuses.push(data.car.status || "Pending");
  if (data.yacht) statuses.push(data.yacht.status || "Pending");

  // If no per-item statuses exist, fall back to top-level status
  if (statuses.length === 0) return data.status || "Pending";

  // If all items still have no per-item status field, use top-level
  const allUndefined = [data.villa?.status, data.car?.status, data.yacht?.status]
    .filter((s) => s !== undefined);
  if (allUndefined.length === 0) return data.status || "Pending";

  const approvedCount = statuses.filter((s) => s === "Approved").length;
  const declinedCount = statuses.filter((s) => s === "Declined").length;

  if (declinedCount === statuses.length) return "Declined";
  if (approvedCount === statuses.length) return "Confirmed";
  if (approvedCount > 0 && approvedCount < statuses.length) return "Partial";
  return "Pending";
}

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// Input type for creating a new booking (without auto-generated fields)
export type BookingRequestInput = Omit<BookingRequest, "id" | "status" | "createdAt" | "customer"> & {
  customer?: Partial<BookingRequest["customer"]>;
  guestInfo?: GuestInfo;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: UserProfile;
  bookingRequests: BookingRequest[];
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, profileData?: Omit<UserProfile, "email">) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: UserProfile) => void;
  addBookingRequest: (request: BookingRequestInput) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_PROFILE: UserProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);

  // Load user profile — try Firestore first (source of truth), fall back to localStorage
  const loadProfile = async (uid: string, email: string) => {
    // Immediately load from localStorage for fast UI (if available)
    const savedProfile = localStorage.getItem(`profile_${uid}`);
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    } else {
      setProfile({ ...DEFAULT_PROFILE, email });
    }

    // Then fetch from Firestore (source of truth) and overwrite
    if (db) {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const firestoreProfile: UserProfile = {
            firstName: data.firstName || data.name?.split(/\s+/)[0] || "",
            lastName: data.lastName || data.name?.split(/\s+/).slice(1).join(" ") || "",
            email: data.email || email,
            phone: data.phone || "",
          };
          setProfile(firestoreProfile);
          // Update localStorage cache so next load is instant
          localStorage.setItem(`profile_${uid}`, JSON.stringify(firestoreProfile));
        }
      } catch (err) {
        console.error("Failed to load profile from Firestore:", err);
      }
    }
  };

  // Subscribe to user's booking requests from Firestore
  useEffect(() => {
    if (!user || !db) {
      setBookingRequests([]);
      return;
    }

    const bookingsRef = collection(db, "bookingRequests");
    const q = query(
      bookingsRef,
      where("customer.uid", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests: BookingRequest[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          status: deriveStatus(data),
          createdAt: data.createdAt?.toDate() || new Date(),
          customer: data.customer,
          villa: data.villa ? {
            ...data.villa,
            checkIn: data.villa.checkIn?.toDate() || new Date(),
            checkOut: data.villa.checkOut?.toDate() || new Date(),
          } : null,
          car: data.car ? {
            ...data.car,
            pickupDate: data.car.pickupDate?.toDate() || new Date(),
            dropoffDate: data.car.dropoffDate?.toDate() || new Date(),
          } : null,
          yacht: data.yacht ? {
            ...data.yacht,
            date: data.yacht.date?.toDate() || new Date(),
          } : null,
          grandTotal: data.grandTotal,
        };
      });
      // Sort client-side to avoid needing a composite index
      requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setBookingRequests(requests);
    }, (error) => {
      console.error("Error fetching bookings:", error);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        loadProfile(user.uid, user.email || "");
      } else {
        setProfile(DEFAULT_PROFILE);
        setBookingRequests([]);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase is not configured");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string, profileData?: Omit<UserProfile, "email">) => {
    if (!auth) throw new Error("Firebase is not configured");
    if (!db) throw new Error("Firestore is not configured");

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    if (userCredential.user) {
      const newProfile: UserProfile = {
        firstName: profileData?.firstName || "",
        lastName: profileData?.lastName || "",
        phone: profileData?.phone || "",
        email: email,
      };

      // Save to localStorage
      localStorage.setItem(`profile_${userCredential.user.uid}`, JSON.stringify(newProfile));
      setProfile(newProfile);

      // Create user document in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        firstName: newProfile.firstName,
        lastName: newProfile.lastName,
        email: newProfile.email,
        phone: newProfile.phone,
        role: "customer", // Default role for new signups
        createdAt: Timestamp.now(),
      });
    }
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const updateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    if (user) {
      localStorage.setItem(`profile_${user.uid}`, JSON.stringify(newProfile));
    }
  };

  const addBookingRequest = async (request: BookingRequestInput): Promise<string> => {
    if (!db) throw new Error("Firestore is not configured");
    if (!user && !request.guestInfo) throw new Error("User must be logged in or provide guest info to create a booking");

    // Build customer data — either from authenticated user or guest info
    let customer;
    if (request.guestInfo) {
      customer = {
        uid: "guest",
        name: `${request.guestInfo.firstName} ${request.guestInfo.lastName}`.trim(),
        email: request.guestInfo.email,
        phone: request.guestInfo.phone,
      };
    } else {
      // Start with local profile data
      let firstName = profile.firstName;
      let lastName = profile.lastName;
      let email = profile.email || user!.email || "";
      let phone = profile.phone || "";

      // If profile name is empty, fetch from Firestore as fallback
      if (!firstName && !lastName && db) {
        try {
          const userDoc = await getDoc(doc(db, "users", user!.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            firstName = data.firstName || data.name?.split(/\s+/)[0] || "";
            lastName = data.lastName || data.name?.split(/\s+/).slice(1).join(" ") || "";
            email = data.email || email;
            phone = data.phone || phone;
          }
        } catch (err) {
          console.error("Failed to fetch profile for booking:", err);
        }
      }

      customer = {
        uid: user!.uid,
        name: `${firstName} ${lastName}`.trim() || user!.email || "Customer",
        email,
        phone,
      };
    }

    // Build the document with Firestore Timestamps
    const bookingDoc = {
      status: "Pending" as const,
      createdAt: Timestamp.now(),
      customer,
      villa: request.villa ? {
        ...(request.villa.id && { id: request.villa.id }),
        name: request.villa.name,
        ...(request.villa.image && { image: request.villa.image }),
        checkIn: Timestamp.fromDate(request.villa.checkIn),
        checkOut: Timestamp.fromDate(request.villa.checkOut),
        price: request.villa.price,
        pricePerNight: request.villa.pricePerNight,
        nights: request.villa.nights,
        location: request.villa.location,
      } : null,
      car: request.car ? {
        ...(request.car.id && { id: request.car.id }),
        name: request.car.name,
        ...(request.car.image && { image: request.car.image }),
        ...(request.car.location && { location: request.car.location }),
        pickupDate: Timestamp.fromDate(request.car.pickupDate),
        dropoffDate: Timestamp.fromDate(request.car.dropoffDate),
        price: request.car.price,
        pricePerDay: request.car.pricePerDay,
        days: request.car.days,
      } : null,
      yacht: request.yacht ? {
        ...(request.yacht.id && { id: request.yacht.id }),
        name: request.yacht.name,
        ...(request.yacht.image && { image: request.yacht.image }),
        ...(request.yacht.location && { location: request.yacht.location }),
        date: Timestamp.fromDate(request.yacht.date),
        startTime: request.yacht.startTime,
        endTime: request.yacht.endTime,
        price: request.yacht.price,
        pricePerHour: request.yacht.pricePerHour,
        hours: request.yacht.hours,
      } : null,
      grandTotal: request.grandTotal,
    };

    const docRef = await addDoc(collection(db, "bookingRequests"), bookingDoc);
    return docRef.id;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        profile,
        bookingRequests,
        login,
        signup,
        logout,
        updateProfile,
        addBookingRequest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
