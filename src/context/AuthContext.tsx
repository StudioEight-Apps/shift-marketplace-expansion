import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface BookingRequest {
  id: string;
  destination: string;
  checkIn: Date;
  checkOut: Date;
  items: { type: string; name: string; price: number }[];
  total: number;
  status: "New" | "Contacted" | "Confirmed" | "Cancelled";
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: UserProfile;
  bookingRequests: BookingRequest[];
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: UserProfile) => void;
  addBookingRequest: (request: Omit<BookingRequest, "id" | "status" | "createdAt">) => string;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // Load profile from localStorage (mock)
        const savedProfile = localStorage.getItem(`profile_${user.uid}`);
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        } else {
          setProfile({ ...DEFAULT_PROFILE, email: user.email || "" });
        }
        // Load booking requests
        const savedRequests = localStorage.getItem(`bookings_${user.uid}`);
        if (savedRequests) {
          const parsed = JSON.parse(savedRequests);
          setBookingRequests(
            parsed.map((r: BookingRequest) => ({
              ...r,
              checkIn: new Date(r.checkIn),
              checkOut: new Date(r.checkOut),
              createdAt: new Date(r.createdAt),
            }))
          );
        }
      } else {
        setProfile(DEFAULT_PROFILE);
        setBookingRequests([]);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    if (user) {
      localStorage.setItem(`profile_${user.uid}`, JSON.stringify(newProfile));
    }
  };

  const addBookingRequest = (request: Omit<BookingRequest, "id" | "status" | "createdAt">) => {
    const newRequest: BookingRequest = {
      ...request,
      id: `REQ-${Date.now().toString(36).toUpperCase()}`,
      status: "New",
      createdAt: new Date(),
    };
    const updated = [...bookingRequests, newRequest];
    setBookingRequests(updated);
    if (user) {
      localStorage.setItem(`bookings_${user.uid}`, JSON.stringify(updated));
    }
    return newRequest.id;
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
