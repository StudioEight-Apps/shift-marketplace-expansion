// ============================================
// BOOKING STATUS SYSTEM
// ============================================

// Line item status types (per Villa/Car/Yacht)
export type LineItemStatus = "Unverified" | "Verified" | "Booked" | "Unavailable";

// Admin-facing status labels for line items
export const lineItemStatusLabels: Record<LineItemStatus, string> = {
  Unverified: "Needs Check",
  Verified: "Available",
  Booked: "Booked",
  Unavailable: "Unavailable",
};

// Admin-facing trip (booking) status - derived from line items
export type TripStatus = "In Review" | "Partially Booked" | "Fully Booked" | "Closed";

// User-facing status - simplified view
export type UserFacingStatus = "Request Received" | "Confirmed" | "In Progress" | "Completed" | "Cancelled";

// Booking interface for status derivation
export interface BookingForStatus {
  status: string; // raw status from Firestore
  paymentCollected?: boolean;
  villa?: { status?: LineItemStatus } | null;
  car?: { status?: LineItemStatus } | null;
  yacht?: { status?: LineItemStatus } | null;
}

// Get all line item statuses from a booking
export const getLineItemStatuses = (booking: BookingForStatus): LineItemStatus[] => {
  const statuses: LineItemStatus[] = [];
  if (booking.villa) statuses.push(booking.villa.status || "Unverified");
  if (booking.car) statuses.push(booking.car.status || "Unverified");
  if (booking.yacht) statuses.push(booking.yacht.status || "Unverified");
  return statuses;
};

// Derive admin-facing trip status from line item statuses
export const deriveTripStatus = (booking: BookingForStatus): TripStatus => {
  // If manually closed (Completed status in Firestore)
  if (booking.status === "Completed" || booking.status === "Closed") {
    return "Closed";
  }

  // If manually cancelled
  if (booking.status === "Cancelled") {
    return "Closed"; // Cancelled maps to Closed in admin view
  }

  const lineItems = getLineItemStatuses(booking);

  if (lineItems.length === 0) return "In Review";

  // Check if all unavailable - this also becomes Closed
  if (lineItems.every((s) => s === "Unavailable")) {
    return "Closed";
  }

  // Count statuses
  const bookedCount = lineItems.filter((s) => s === "Booked").length;
  const unavailableCount = lineItems.filter((s) => s === "Unavailable").length;
  const availableItems = lineItems.length - unavailableCount;

  // All available items are booked
  if (bookedCount === availableItems && bookedCount > 0) {
    return "Fully Booked";
  }

  // Some items booked, some not (excluding unavailable)
  if (bookedCount > 0) {
    return "Partially Booked";
  }

  // All items are Unverified or Verified (none booked yet)
  return "In Review";
};

// Derive user-facing status from trip status + payment
export const deriveUserFacingStatus = (booking: BookingForStatus): UserFacingStatus => {
  const rawStatus = booking.status;

  // Manual overrides
  if (rawStatus === "Cancelled") {
    return "Cancelled";
  }

  if (rawStatus === "Completed") {
    return "Completed";
  }

  const tripStatus = deriveTripStatus(booking);
  const lineItems = getLineItemStatuses(booking);

  // All unavailable = Cancelled
  if (lineItems.length > 0 && lineItems.every((s) => s === "Unavailable")) {
    return "Cancelled";
  }

  // Closed by admin
  if (tripStatus === "Closed") {
    return "Completed";
  }

  // Fully Booked + Payment Collected = Confirmed
  if (tripStatus === "Fully Booked" && booking.paymentCollected) {
    return "Confirmed";
  }

  // Partially Booked OR Fully Booked without payment = In Progress
  if (tripStatus === "Partially Booked" || tripStatus === "Fully Booked") {
    return "In Progress";
  }

  // In Review = Request Received
  return "Request Received";
};

// Color classes for admin trip status
export const tripStatusColors: Record<TripStatus, string> = {
  "In Review": "bg-amber-500/20 text-amber-400",
  "Partially Booked": "bg-blue-500/20 text-blue-400",
  "Fully Booked": "bg-green-500/20 text-green-400",
  "Closed": "bg-gray-500/20 text-gray-400",
};

// Color classes for user-facing status
export const userFacingStatusColors: Record<UserFacingStatus, string> = {
  "Request Received": "bg-amber-500/20 text-amber-400",
  "Confirmed": "bg-green-500/20 text-green-400",
  "In Progress": "bg-blue-500/20 text-blue-400",
  "Completed": "bg-gray-500/20 text-gray-400",
  "Cancelled": "bg-red-500/20 text-red-400",
};

// Color classes for line item status
export const lineItemStatusColors: Record<LineItemStatus, string> = {
  Unverified: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  Verified: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Booked: "bg-green-500/20 text-green-400 border-green-500/30",
  Unavailable: "bg-red-500/20 text-red-400 border-red-500/30",
};

// All line item status options
export const lineItemStatusOptions: LineItemStatus[] = ["Unverified", "Verified", "Booked", "Unavailable"];
