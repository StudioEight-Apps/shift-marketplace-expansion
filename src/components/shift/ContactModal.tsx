import { useState } from "react";
import { X, Send, CheckCircle2, Phone, CalendarIcon, MapPin, Users, Home, Car, Ship } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useContact } from "@/context/ContactContext";
import { notifyContact } from "@/lib/notify";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const CITIES = [
  "Miami, FL",
  "Los Angeles, CA",
  "New York City, NY",
  "Las Vegas, NV",
  "Scottsdale, AZ",
  "Aspen, CO",
  "Austin, TX",
  "Nashville, TN",
  "The Hamptons, NY",
  "Park City, UT",
];

const ContactModal = () => {
  const { isOpen, closeContact } = useContact();
  const { user } = useAuth();

  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [needs, setNeeds] = useState<string[]>([]);
  const [groupSize, setGroupSize] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setName(user?.displayName || "");
    setEmail(user?.email || "");
    setPhone("");
    setCity("");
    setCheckIn(undefined);
    setCheckOut(undefined);
    setNeeds([]);
    setGroupSize("");
    setNotes("");
    setSubmitted(false);
    closeContact();
  };

  const toggleNeed = (need: string) => {
    setNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const checkInStr = checkIn ? format(checkIn, "yyyy-MM-dd") : "";
      const checkOutStr = checkOut ? format(checkOut, "yyyy-MM-dd") : "";

      const inquiryData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        needs,
        groupSize: groupSize ? Number(groupSize) : null,
        message: notes.trim(),
        type: "concierge",
        userId: user?.uid || null,
        createdAt: serverTimestamp(),
        status: "new",
      };

      await addDoc(collection(db, "contactInquiries"), inquiryData);

      // Build a readable message for email notification
      const needsStr = needs.length > 0 ? needs.join(", ") : "Not specified";
      const fullMessage = [
        `City: ${city || "Not specified"}`,
        `Dates: ${checkInStr || "TBD"} → ${checkOutStr || "TBD"}`,
        `Needs: ${needsStr}`,
        `Group Size: ${groupSize || "Not specified"}`,
        notes.trim() ? `Notes: ${notes.trim()}` : "",
      ].filter(Boolean).join("\n");

      // Fire-and-forget email notification
      notifyContact({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: fullMessage,
      });

      // GHL sync (fire-and-forget)
      syncToGHL({
        guestName: name.trim(),
        guestEmail: email.trim(),
        guestPhone: phone.trim(),
        assetType: "Concierge Request",
        assetName: `${city || "No city"} | ${needsStr}`,
        guestNotes: fullMessage,
      }).catch((err) => console.error("GHL sync failed (non-blocking):", err));

      setSubmitted(true);
    } catch (error) {
      console.error("Error sending inquiry:", error);
      toast.error("Failed to send request. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-background border border-border-subtle rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card border border-border-subtle rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {submitted ? (
          /* Success Screen */
          <div className="p-8 flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-green-500/10 p-4">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Request Received
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Our concierge team will curate personalized options and get back to
              you within the hour.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-card flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Plan Your Trip
                </h2>
                <p className="text-xs text-muted-foreground">
                  Tell us what you need — we'll handle the rest
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Call CTA */}
              <a
                href="tel:+17868770975"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Phone className="h-4 w-4" />
                Call (786) 877-0975
              </a>

              <div className="relative flex items-center gap-3">
                <div className="flex-1 border-t border-border-subtle" />
                <span className="text-xs text-muted-foreground">
                  or submit a request
                </span>
                <div className="flex-1 border-t border-border-subtle" />
              </div>

              {/* Name + Phone row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@example.com"
                  required
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  <MapPin className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                  Destination
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select a city</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    <CalendarIcon className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                    Check-in
                  </label>
                  <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                    <PopoverTrigger asChild>
                      <button type="button" className={`${inputClass} text-left ${!checkIn ? "text-muted-foreground" : ""}`}>
                        {checkIn ? format(checkIn, "MMM d, yyyy") : "Select date"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" avoidCollisions collisionPadding={16}>
                      <Calendar
                        mode="single"
                        selected={checkIn}
                        onSelect={(day) => {
                          setCheckIn(day);
                          setCheckInOpen(false);
                          // Auto-open check-out if not set
                          if (!checkOut) setTimeout(() => setCheckOutOpen(true), 150);
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    <CalendarIcon className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                    Check-out
                  </label>
                  <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                    <PopoverTrigger asChild>
                      <button type="button" className={`${inputClass} text-left ${!checkOut ? "text-muted-foreground" : ""}`}>
                        {checkOut ? format(checkOut, "MMM d, yyyy") : "Select date"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" avoidCollisions collisionPadding={16}>
                      <Calendar
                        mode="single"
                        selected={checkOut}
                        onSelect={(day) => {
                          setCheckOut(day);
                          setCheckOutOpen(false);
                        }}
                        disabled={(date) =>
                          date < (checkIn || new Date(new Date().setHours(0, 0, 0, 0)))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* What do you need */}
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  What do you need?
                </label>
                <div className="flex gap-2">
                  {[
                    { key: "Stays", icon: Home, label: "Stays" },
                    { key: "Cars", icon: Car, label: "Cars" },
                    { key: "Yachts", icon: Ship, label: "Yachts" },
                  ].map(({ key, icon: Icon, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleNeed(key)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        needs.includes(key)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border-subtle bg-background text-muted-foreground hover:text-foreground hover:border-foreground/30"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group size */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  <Users className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                  Group Size
                </label>
                <input
                  type="number"
                  value={groupSize}
                  onChange={(e) => setGroupSize(e.target.value)}
                  className={inputClass}
                  placeholder="Number of guests"
                  min="1"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Notes / Special Requests
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`${inputClass} resize-none`}
                  placeholder="Occasion, preferences, budget range, anything else we should know..."
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm"
              >
                {sending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Request
                  </>
                )}
              </button>

              <p className="text-xs text-center text-muted-foreground">
                We'll get back to you within 1 hour with curated options.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

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

export default ContactModal;
