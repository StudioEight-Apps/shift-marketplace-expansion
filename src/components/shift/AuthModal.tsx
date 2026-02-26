import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { z } from "zod";

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onGuestSubmit?: (guestInfo: GuestInfo) => void;
  defaultTab?: "login" | "signup" | "guest";
}

const emailSchema = z.string().trim().email("Invalid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const nameSchema = z.string().trim().min(1, "This field is required");
const phoneSchema = z.string().trim().min(10, "Please enter a valid phone number");

const AuthModal = ({ isOpen, onClose, onSuccess, onGuestSubmit, defaultTab = "login" }: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState<"login" | "signup" | "guest">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { login, signup } = useAuth();

  if (!isOpen) return null;

  const validateForm = () => {
    // Validate signup and guest fields (both need name/email/phone)
    if (activeTab === "signup" || activeTab === "guest") {
      const firstNameResult = nameSchema.safeParse(firstName);
      if (!firstNameResult.success) {
        setError("First name is required");
        return false;
      }
      const lastNameResult = nameSchema.safeParse(lastName);
      if (!lastNameResult.success) {
        setError("Last name is required");
        return false;
      }
      const phoneResult = phoneSchema.safeParse(phone);
      if (!phoneResult.success) {
        setError(phoneResult.error.errors[0].message);
        return false;
      }
    }

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setError(emailResult.error.errors[0].message);
      return false;
    }

    // Only validate password for login/signup (not guest)
    if (activeTab !== "guest") {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        setError(passwordResult.error.errors[0].message);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (activeTab === "guest") {
        // Guest flow — no Firebase Auth, just pass info back
        onGuestSubmit?.({ firstName, lastName, email, phone });
        onClose();
        return;
      }

      if (activeTab === "login") {
        await login(email, password);
      } else {
        await signup(email, password, { firstName, lastName, phone });
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!firebaseAuth) {
      setError("Firebase is not configured");
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
      setResetSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || "";
      if (code.includes("user-not-found")) {
        setError("No account found with this email");
      } else if (code.includes("invalid-email")) {
        setError("Invalid email address");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
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
          <button
            onClick={() => {
              setActiveTab("guest");
              setError("");
            }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === "guest"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Guest
          </button>
        </div>

        {/* Form */}
        {resetMode ? (
          <div className="space-y-4">
            {resetSent ? (
              <div className="text-center space-y-3">
                <p className="text-foreground font-medium">Check your email</p>
                <p className="text-muted-foreground text-sm">
                  We sent a password reset link to <strong>{email}</strong>
                </p>
                <button
                  onClick={() => {
                    setResetMode(false);
                    setResetSent(false);
                    setError("");
                  }}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Back to Log In
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter your email and we'll send you a link to reset your password.
                </p>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-background border-border-subtle"
                    disabled={resetLoading}
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-5"
                  disabled={resetLoading}
                >
                  {resetLoading ? "Sending..." : "Send Reset Link"}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setResetMode(false);
                    setError("");
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to Log In
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name & phone fields for signup and guest */}
              {(activeTab === "signup" || activeTab === "guest") && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1.5">First Name</label>
                      <Input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="bg-background border-border-subtle"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1.5">Last Name</label>
                      <Input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="bg-background border-border-subtle"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1.5">Phone Number</label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="bg-background border-border-subtle"
                      disabled={loading}
                    />
                  </div>
                </>
              )}
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
              {/* Password field — only for login/signup, not guest */}
              {activeTab !== "guest" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm text-muted-foreground">Password</label>
                    {activeTab === "login" && (
                      <button
                        type="button"
                        onClick={() => {
                          setResetMode(true);
                          setError("");
                        }}
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-background border-border-subtle pr-10"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-5"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : activeTab === "login"
                    ? "Log In"
                    : activeTab === "signup"
                      ? "Sign Up"
                      : "Continue as Guest"}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-4">
              {activeTab === "login"
                ? "Don't have an account? Click Sign Up above."
                : activeTab === "signup"
                  ? "Already have an account? Click Log In above."
                  : "No account needed. We'll contact you to confirm your booking."}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
