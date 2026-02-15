import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import shiftLogo from "@/assets/shift-logo-horizontal.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      if (err.message?.includes("Unauthorized")) {
        setError("Unauthorized access. You do not have admin privileges.");
      } else {
        setError("Invalid email or password");
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
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={shiftLogo}
            alt="Shift Rentals"
            className="h-12 mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-primary mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">
            {resetMode ? "Reset your password" : "Sign in to manage bookings"}
          </p>
        </div>

        {resetMode ? (
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            {resetSent ? (
              <div className="text-center space-y-3">
                <p className="text-foreground font-medium">Check your email</p>
                <p className="text-muted-foreground text-sm">
                  We sent a password reset link to <strong>{email}</strong>
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setResetMode(false);
                    setResetSent(false);
                    setError("");
                  }}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                {error && (
                  <p className="text-destructive text-sm">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full"
                  size="lg"
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
                  Back to Sign In
                </button>
              </form>
            )}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-card rounded-xl border border-border p-6 space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@shiftrentals.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
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
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-destructive text-sm">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
