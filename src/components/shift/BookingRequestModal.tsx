import { useState } from "react";
import { X } from "lucide-react";
import { createBookingRequest } from "@/lib/listings";
import type { Listing } from "./ListingCard";

interface BookingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  checkIn: Date | null;
  checkOut: Date | null;
  guests?: number;
  hours?: number;
}

const BookingRequestModal = ({
  isOpen,
  onClose,
  listing,
  checkIn,
  checkOut,
  guests,
  hours,
}: BookingRequestModalProps) => {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestNotes, setGuestNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!checkIn || (!checkOut && listing.assetType !== "Yachts")) {
      setError("Please select valid dates");
      return;
    }

    if (!guestName || !guestEmail || !guestPhone) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const assetTypeMap: Record<string, "villa" | "car" | "yacht"> = {
        Stays: "villa",
        Cars: "car",
        Yachts: "yacht",
      };

      await createBookingRequest({
        assetType: assetTypeMap[listing.assetType || "Stays"],
        assetId: listing.id,
        assetName: listing.title,
        guestName,
        guestEmail,
        guestPhone,
        checkIn: checkIn,
        checkOut: checkOut || checkIn,
        guests: guests || listing.guests,
        hours: listing.assetType === "Yachts" ? hours : undefined,
        guestNotes,
      });

      setSubmitted(true);
    } catch (err) {
      setError("Failed to submit booking request. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setGuestNotes("");
    setError("");
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg bg-background rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="p-6">
          {submitted ? (
            /* Success State */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Request Submitted!
              </h3>
              <p className="text-muted-foreground mb-6">
                Your booking request has been sent. Our concierge team will review and respond
                within 24 hours.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            /* Form State */
            <>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Request to Book</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Submit your booking request and our concierge will confirm availability.
              </p>

              {/* Booking Summary */}
              <div className="bg-secondary/40 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-foreground mb-2">{listing.title}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {checkIn && (
                    <p>
                      {listing.assetType === "Yachts" ? "Date" : "Check-in"}:{" "}
                      {checkIn.toLocaleDateString()}
                    </p>
                  )}
                  {checkOut && listing.assetType !== "Yachts" && (
                    <p>Check-out: {checkOut.toLocaleDateString()}</p>
                  )}
                  {listing.assetType === "Yachts" && hours && <p>Duration: {hours} hours</p>}
                  {guests && <p>Guests: {guests}</p>}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    required
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    value={guestNotes}
                    onChange={(e) => setGuestNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                    placeholder="Any special requests or questions..."
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  You won't be charged yet. Our team will confirm your booking.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingRequestModal;
