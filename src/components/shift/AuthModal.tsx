import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { z } from "zod";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultTab?: "login" | "signup";
}

const emailSchema = z.string().trim().email("Invalid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const AuthModal = ({ isOpen, onClose, onSuccess, defaultTab = "login" }: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  if (!isOpen) return null;

  const validateForm = () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setError(emailResult.error.errors[0].message);
      return false;
    }
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setError(passwordResult.error.errors[0].message);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (activeTab === "login") {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      console.error("Auth error:", err);
      if (err instanceof Error) {
        const errorCode = (err as { code?: string }).code || err.message;
        if (errorCode.includes("user-not-found") || errorCode.includes("auth/user-not-found")) {
          setError("No account found with this email");
        } else if (errorCode.includes("wrong-password") || errorCode.includes("auth/wrong-password") || errorCode.includes("auth/invalid-credential")) {
          setError("Incorrect email or password");
        } else if (errorCode.includes("email-already-in-use") || errorCode.includes("auth/email-already-in-use")) {
          setError("An account with this email already exists");
        } else if (errorCode.includes("auth/invalid-email")) {
          setError("Invalid email address");
        } else if (errorCode.includes("auth/weak-password")) {
          setError("Password should be at least 6 characters");
        } else if (errorCode.includes("auth/operation-not-allowed")) {
          setError("Email/password sign-in is not enabled. Please enable it in Firebase Console.");
        } else if (errorCode.includes("Firebase is not configured")) {
          setError("Firebase is not configured. Please check your environment variables.");
        } else {
          setError(err.message || "Authentication failed. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-md mx-4 rounded-xl bg-card border border-border-subtle p-6 shadow-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Tabs */}
        <div className="flex border-b border-border-subtle mb-6">
          <button
            onClick={() => {
              setActiveTab("login");
              setError("");
            }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === "login"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => {
              setActiveTab("signup");
              setError("");
            }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === "signup"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-background border-border-subtle"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-background border-border-subtle"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-5"
            disabled={loading}
          >
            {loading ? "Please wait..." : activeTab === "login" ? "Log In" : "Sign Up"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          {activeTab === "login"
            ? "Don't have an account? Click Sign Up above."
            : "Already have an account? Click Log In above."}
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
