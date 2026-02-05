// ============================================
// SIMPLIFIED BOOKING STATUS SYSTEM
// ============================================

// Per-item status (Villa/Car/Yacht) - simple approve/decline
export type ItemStatus = "Pending" | "Approved" | "Declined";

// Overall booking status - derived from item statuses
export type BookingStatus = "Pending" | "Approved" | "Partial" | "Declined";

// Booking interface for status derivation
export interface BookingForStatus {
  villa?: { status?: ItemStatus } | null;
  car?: { status?: ItemStatus } | null;
  yacht?: { status?: ItemStatus } | null;
}

// Get all item statuses from a booking
export const getItemStatuses = (booking: BookingForStatus): ItemStatus[] => {
  const statuses: ItemStatus[] = [];
  if (booking.villa) statuses.push(booking.villa.status || "Pending");
  if (booking.car) statuses.push(booking.car.status || "Pending");
  if (booking.yacht) statuses.push(booking.yacht.status || "Pending");
  return statuses;
};

// Derive overall booking status from item statuses
export const deriveBookingStatus = (booking: BookingForStatus): BookingStatus => {
  const statuses = getItemStatuses(booking);

  if (statuses.length === 0) return "Pending";

  const approvedCount = statuses.filter((s) => s === "Approved").length;
  const declinedCount = statuses.filter((s) => s === "Declined").length;
  const pendingCount = statuses.filter((s) => s === "Pending").length;

  // All approved
  if (approvedCount === statuses.length) {
    return "Approved";
  }

  // All declined
  if (declinedCount === statuses.length) {
    return "Declined";
  }

  // All still pending
  if (pendingCount === statuses.length) {
    return "Pending";
  }

  // Mixed (some approved, some declined, or decisions still pending)
  return "Partial";
};

// Color classes for booking status badges
export const bookingStatusColors: Record<BookingStatus, string> = {
  Pending: "bg-amber-500/20 text-amber-400",
  Approved: "bg-green-500/20 text-green-400",
  Partial: "bg-blue-500/20 text-blue-400",
  Declined: "bg-red-500/20 text-red-400",
};

// Color classes for item status badges
export const itemStatusColors: Record<ItemStatus, string> = {
  Pending: "bg-amber-500/20 text-amber-400",
  Approved: "bg-green-500/20 text-green-400",
  Declined: "bg-red-500/20 text-red-400",
};
