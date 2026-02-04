import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc, Timestamp, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { ArrowLeft, Mail, Phone, Home, Car, Ship, Plus, Clock, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import {
  LineItemStatus,
  lineItemStatusLabels,
  lineItemStatusOptions,
  lineItemStatusColors,
  deriveTripStatus,
  tripStatusColors,
} from "@/lib/bookingStatus";
import { updateVilla, updateCar, updateYacht } from "@/lib/listings";

interface ActivityLogEntry {
  action: string;
  actor: string;
  timestamp: Date;
  details?: string;
}

interface BookingRequest {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
  customer: {
    uid: string;
    name: string;
    email: string;
    phone: string;
  };
  villa: {
    id?: string;
    name: string;
    checkIn: Date;
    checkOut: Date;
    nights: number;
    pricePerNight: number;
    price: number;
    location: string;
    status?: LineItemStatus;
  } | null;
  car: {
    id?: string;
    name: string;
    pickupDate: Date;
    dropoffDate: Date;
    days: number;
    pricePerDay: number;
    price: number;
    status?: LineItemStatus;
  } | null;
  yacht: {
    id?: string;
    name: string;
    date: Date;
    startTime: string;
    endTime: string;
    hours: number;
    pricePerHour: number;
    price: number;
    status?: LineItemStatus;
  } | null;
  grandTotal: number;
  notes?: { text: string; author: string; timestamp: Date }[];
  activityLog?: ActivityLogEntry[];
  readyToCollect?: boolean;
  paymentCollected?: boolean;
}

const RequestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(
      doc(db, "bookingRequests", id),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBooking({
            id: docSnap.id,
            status: data.status || "Pending",
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate(),
            customer: data.customer,
            villa: data.villa
              ? {
                  ...data.villa,
                  checkIn: data.villa.checkIn?.toDate() || new Date(),
                  checkOut: data.villa.checkOut?.toDate() || new Date(),
                  status: data.villa.status || "Unverified",
                }
              : null,
            car: data.car
              ? {
                  ...data.car,
                  pickupDate: data.car.pickupDate?.toDate() || new Date(),
                  dropoffDate: data.car.dropoffDate?.toDate() || new Date(),
                  status: data.car.status || "Unverified",
                }
              : null,
            yacht: data.yacht
              ? {
                  ...data.yacht,
                  date: data.yacht.date?.toDate() || new Date(),
                  status: data.yacht.status || "Unverified",
                }
              : null,
            grandTotal: data.grandTotal,
            notes:
              data.notes?.map((n: { text: string; author: string; timestamp: { toDate: () => Date } }) => ({
                ...n,
                timestamp: n.timestamp?.toDate() || new Date(),
              })) || [],
            activityLog:
              data.activityLog?.map(
                (a: { action: string; actor: string; timestamp: { toDate: () => Date }; details?: string }) => ({
                  ...a,
                  timestamp: a.timestamp?.toDate() || new Date(),
                })
              ) || [],
            readyToCollect: data.readyToCollect || false,
            paymentCollected: data.paymentCollected || false,
          });
          setError(null);
        } else {
          setError("Booking not found");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching booking:", err);
        setError("Failed to load booking. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  // Log activity with atomic update
  const logActivity = async (action: string, details?: string) => {
    if (!id) return;

    const activity = {
      action,
      actor: user?.email || "Admin",
      timestamp: Timestamp.now(),
      details,
    };

    await updateDoc(doc(db, "bookingRequests", id), {
      activityLog: arrayUnion(activity),
      updatedAt: Timestamp.now(),
    });
  };

  // Helper to get date range string for blocking
  const getDateRange = (start: Date, end: Date): string[] => {
    const dates: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(format(current, "yyyy-MM-dd"));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  // Update line item status and block calendar if Booked
  const updateLineItemStatus = async (itemType: "villa" | "car" | "yacht", newStatus: LineItemStatus) => {
    if (!id || !booking) return;
    setSaving(true);
    try {
      const currentItem = booking[itemType];
      const oldStatus = currentItem?.status || "Unverified";

      // Update the booking document
      await updateDoc(doc(db, "bookingRequests", id), {
        [`${itemType}.status`]: newStatus,
        updatedAt: Timestamp.now(),
      });

      // If status changed to "Booked", block the dates on the inventory item
      if (newStatus === "Booked" && currentItem?.id) {
        let datesToBlock: string[] = [];

        if (itemType === "villa" && booking.villa) {
          datesToBlock = getDateRange(booking.villa.checkIn, booking.villa.checkOut);
          await updateVilla(currentItem.id, {
            blockedDates: datesToBlock,
          });
        } else if (itemType === "car" && booking.car) {
          datesToBlock = getDateRange(booking.car.pickupDate, booking.car.dropoffDate);
          await updateCar(currentItem.id, {
            blockedDates: datesToBlock,
          });
        } else if (itemType === "yacht" && booking.yacht) {
          datesToBlock = [format(booking.yacht.date, "yyyy-MM-dd")];
          await updateYacht(currentItem.id, {
            blockedDates: datesToBlock,
          });
        }
      }

      await logActivity(
        `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} status: ${lineItemStatusLabels[oldStatus]} → ${lineItemStatusLabels[newStatus]}`
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
    setSaving(false);
  };

  const updatePaymentFlag = async (field: "readyToCollect" | "paymentCollected", value: boolean) => {
    if (!id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "bookingRequests", id), {
        [field]: value,
        updatedAt: Timestamp.now(),
      });

      const actionText =
        field === "readyToCollect"
          ? value
            ? "Marked ready to collect payment"
            : "Removed ready to collect flag"
          : value
            ? "Payment collected"
            : "Payment collection removed";
      await logActivity(actionText);
    } catch (error) {
      console.error("Error updating payment flag:", error);
    }
    setSaving(false);
  };

  const markBookingClosed = async () => {
    if (!id || !booking) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "bookingRequests", id), {
        status: "Completed",
        updatedAt: Timestamp.now(),
      });
      await logActivity("Trip closed by admin");
    } catch (error) {
      console.error("Error closing booking:", error);
    }
    setSaving(false);
  };

  const markBookingCancelled = async () => {
    if (!id || !booking) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "bookingRequests", id), {
        status: "Cancelled",
        updatedAt: Timestamp.now(),
      });
      await logActivity("Trip cancelled by admin");
    } catch (error) {
      console.error("Error cancelling booking:", error);
    }
    setSaving(false);
  };

  const addNote = async () => {
    if (!id || !newNote.trim()) return;
    setSaving(true);
    try {
      const note = {
        text: newNote.trim(),
        author: user?.email || "Admin",
        timestamp: Timestamp.now(),
      };
      await updateDoc(doc(db, "bookingRequests", id), {
        notes: arrayUnion(note),
        updatedAt: Timestamp.now(),
      });
      setNewNote("");
    } catch (error) {
      console.error("Error adding note:", error);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Loading..." />
        <div className="p-6 text-gray-500">Loading booking details...</div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Error" />
        <div className="p-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <p className="text-red-400 text-lg">{error || "Booking not found"}</p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30"
              >
                Back to Bookings
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tripStatus = deriveTripStatus(booking);

  return (
    <div className="flex flex-col h-full">
      <Header title={`Booking ${booking.id.slice(0, 8)}...`} />

      <div className="p-6 space-y-6 overflow-auto">
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bookings
        </button>

        <div className="grid grid-cols-3 gap-6">
          {/* Left column */}
          <div className="col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Customer</h2>
              <div className="space-y-3">
                <p className="text-xl font-medium text-white">{booking.customer.name}</p>
                <a
                  href={`mailto:${booking.customer.email}`}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {booking.customer.email}
                </a>
                <a
                  href={`tel:${booking.customer.phone}`}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {booking.customer.phone || "No phone"}
                </a>
                {booking.customer.uid && (
                  <button
                    onClick={() => navigate(`/users/${booking.customer.uid}`)}
                    className="text-sm text-gray-400 hover:text-primary transition-colors"
                  >
                    View full profile →
                  </button>
                )}
              </div>
            </div>

            {/* Line Items with Status Management */}
            {booking.villa && (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-blue-400" />
                    <h2 className="text-lg font-semibold text-white">Villa</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Availability:</span>
                    <select
                      value={booking.villa.status || "Unverified"}
                      onChange={(e) => updateLineItemStatus("villa", e.target.value as LineItemStatus)}
                      disabled={saving}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border focus:outline-none ${lineItemStatusColors[booking.villa.status || "Unverified"]}`}
                    >
                      {lineItemStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {lineItemStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Property</p>
                    <p className="text-white font-medium">{booking.villa.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Location</p>
                    <p className="text-white">{booking.villa.location}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Check-in</p>
                    <p className="text-white">{format(booking.villa.checkIn, "MMM d, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Check-out</p>
                    <p className="text-white">{format(booking.villa.checkOut, "MMM d, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Duration</p>
                    <p className="text-white">{booking.villa.nights} nights</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Subtotal</p>
                    <p className="text-white font-medium">${booking.villa.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {booking.car && (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-purple-400" />
                    <h2 className="text-lg font-semibold text-white">Car</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Availability:</span>
                    <select
                      value={booking.car.status || "Unverified"}
                      onChange={(e) => updateLineItemStatus("car", e.target.value as LineItemStatus)}
                      disabled={saving}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border focus:outline-none ${lineItemStatusColors[booking.car.status || "Unverified"]}`}
                    >
                      {lineItemStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {lineItemStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Vehicle</p>
                    <p className="text-white font-medium">{booking.car.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Pick-up</p>
                    <p className="text-white">{format(booking.car.pickupDate, "MMM d, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Drop-off</p>
                    <p className="text-white">{format(booking.car.dropoffDate, "MMM d, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Duration</p>
                    <p className="text-white">{booking.car.days} days</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Subtotal</p>
                    <p className="text-white font-medium">${booking.car.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {booking.yacht && (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Ship className="h-5 w-5 text-cyan-400" />
                    <h2 className="text-lg font-semibold text-white">Yacht</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Availability:</span>
                    <select
                      value={booking.yacht.status || "Unverified"}
                      onChange={(e) => updateLineItemStatus("yacht", e.target.value as LineItemStatus)}
                      disabled={saving}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border focus:outline-none ${lineItemStatusColors[booking.yacht.status || "Unverified"]}`}
                    >
                      {lineItemStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {lineItemStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Vessel</p>
                    <p className="text-white font-medium">{booking.yacht.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Date</p>
                    <p className="text-white">{format(booking.yacht.date, "MMM d, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Time</p>
                    <p className="text-white">
                      {booking.yacht.startTime} - {booking.yacht.endTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Duration</p>
                    <p className="text-white">{booking.yacht.hours} hours</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Subtotal</p>
                    <p className="text-white font-medium">${booking.yacht.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Internal Notes</h2>

              <div className="space-y-3 mb-4">
                {booking.notes && booking.notes.length > 0 ? (
                  booking.notes
                    .slice()
                    .reverse()
                    .map((note, i) => (
                      <div key={i} className="bg-background rounded-lg p-3">
                        <p className="text-white text-sm">{note.text}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {note.author} · {format(note.timestamp, "MMM d, h:mm a")}
                        </p>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-500 text-sm">No notes yet</p>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  onKeyDown={(e) => e.key === "Enter" && addNote()}
                />
                <button
                  onClick={addNote}
                  disabled={saving || !newNote.trim()}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-black font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Trip Status */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Trip Status</h2>
              <div className={`inline-flex px-4 py-2 rounded-lg text-sm font-medium ${tripStatusColors[tripStatus]}`}>
                {tripStatus}
              </div>
              <p className="text-gray-500 text-xs mt-3">Derived from item availability statuses</p>
              <p className="text-gray-500 text-xs mt-1">
                Submitted {format(booking.createdAt, "MMM d, yyyy 'at' h:mm a")}
              </p>

              {/* Manual Actions */}
              {tripStatus !== "Closed" && (
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <button
                    onClick={markBookingClosed}
                    disabled={saving}
                    className="w-full px-3 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    Close Trip
                  </button>
                  <button
                    onClick={markBookingCancelled}
                    disabled={saving}
                    className="w-full px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel Trip
                  </button>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Pricing</h2>
              <div className="space-y-2 text-sm">
                {booking.villa && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Villa</span>
                    <span className="text-white">${booking.villa.price.toLocaleString()}</span>
                  </div>
                )}
                {booking.car && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Car</span>
                    <span className="text-white">${booking.car.price.toLocaleString()}</span>
                  </div>
                )}
                {booking.yacht && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Yacht</span>
                    <span className="text-white">${booking.yacht.price.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-white font-medium">Total</span>
                  <span className="text-primary font-bold text-lg">${booking.grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-white">Payment</h2>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={booking.readyToCollect || false}
                    onChange={(e) => updatePaymentFlag("readyToCollect", e.target.checked)}
                    disabled={saving}
                    className="w-4 h-4 rounded border-gray-600 text-primary focus:ring-primary bg-background"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 text-sm">Ready to Collect Payment</span>
                    {booking.readyToCollect && <CheckCircle className="h-4 w-4 text-amber-400" />}
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={booking.paymentCollected || false}
                    onChange={(e) => updatePaymentFlag("paymentCollected", e.target.checked)}
                    disabled={saving}
                    className="w-4 h-4 rounded border-gray-600 text-primary focus:ring-primary bg-background"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 text-sm">Payment Collected</span>
                    {booking.paymentCollected && <CheckCircle className="h-4 w-4 text-green-400" />}
                  </div>
                </label>
              </div>
            </div>

            {/* Activity History */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-white">Activity History</h2>
              </div>
              <div className="space-y-3 max-h-64 overflow-auto">
                {/* Created entry */}
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-300">Trip request submitted</p>
                    <p className="text-xs text-gray-500">{format(booking.createdAt, "MMM d, yyyy 'at' h:mm a")}</p>
                  </div>
                </div>
                {/* Activity log entries */}
                {booking.activityLog &&
                  booking.activityLog
                    .slice()
                    .reverse()
                    .map((activity, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-300">{activity.action}</p>
                          <p className="text-xs text-gray-500">
                            {activity.actor} · {format(activity.timestamp, "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;
