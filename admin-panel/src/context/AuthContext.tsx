import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserRole } from "@/lib/types";

const ALLOWED_ROLES: UserRole[] = ["owner", "admin", "viewer"];

interface ProfileInfo {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  profile: ProfileInfo | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firestore profile changes in real-time
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const name =
          data.name ||
          `${data.firstName || ""} ${data.lastName || ""}`.trim() ||
          "";
        setProfile({
          name,
          email: data.email || user.email || "",
        });
        // Also keep role in sync
        const userRole = data.role as string;
        if (userRole && ALLOWED_ROLES.includes(userRole as UserRole)) {
          setRole(userRole as UserRole);
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user has an allowed role in Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        const userData = userDoc.data();
        const userRole = userData?.role as string;

        if (userRole && ALLOWED_ROLES.includes(userRole as UserRole)) {
          setUser(firebaseUser);
          setRole(userRole as UserRole);
        } else {
          // Not an authorized role - sign them out
          await signOut(auth);
          setUser(null);
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    // First authenticate with Firebase
    const credential = await signInWithEmailAndPassword(auth, email, password);

    // Then check if user has an allowed role in Firestore
    const userDoc = await getDoc(doc(db, "users", credential.user.uid));
    const userData = userDoc.data();
    const userRole = userData?.role as string;

    if (!userRole || !ALLOWED_ROLES.includes(userRole as UserRole)) {
      // Not authorized - sign them out and throw error
      await signOut(auth);
      throw new Error("Unauthorized access");
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        profile,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
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
