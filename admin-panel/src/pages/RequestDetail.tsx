import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc, Timestamp, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { ArrowLeft, Mail, Phone, Home, Car, Ship, Plus, Clock, Check, X, AlertCircle, RotateCcw } from "lucide-react";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { ItemStatus, deriveBookingStatus, bookingStatusColors, itemStatusColors } from "@/lib/bookingStatus";
import { updateVilla, updateCar, updateYacht } from "@/lib/listings";

interface ActivityLogEntry {
  action: string;
  actor: string;
  timestamp: Date;
  details?: string;
}

interface BookingRequest {
  id: string;
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
    status?: ItemStatus;
  } | null;
  car: {
    id?: string;
    name: string;
    pickupDate: Date;
    dropoffDate: Date;
    days: number;
    pricePerDay: number;
    price: number;
    status?: ItemStatus;
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
    status?: ItemStatus;
  } | null;
  grandTotal: number;
  notes?: { text: string; author: string; timestamp: Date }[];
  activityLog?: ActivityLogEntry[];
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
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate(),
            customer: data.customer,
            villa: data.villa
              ? {
                  ...data.villa,
                  checkIn: data.villa.checkIn?.toDate() || new Date(),
                  checkOut: data.villa.checkOut?.toDate() || new Date(),
                  status: data.villa.status || "Pending",
                }
              : null,
            car: data.car
              ? {
                  ...data.car,
                  pickupDate: data.car.pickupDate?.toDate() || new Date(),
                  dropoffDate: data.car.dropoffDate?.toDate() || new Date(),
                  status: data.car.status || "Pending",
                }
              : null,
            yacht: data.yacht
              ? {
                  ...data.yacht,
                  date: data.yacht.date?.toDate() || new Date(),
                  status: data.yacht.status || "Pending",
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
  const logActivity = async (action: string) => {
    if (!id) return;

    const activity = {
      action,
      actor: user?.email || "Admin",
      timestamp: Timestamp.now(),
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

  // Approve an item - sets status to Approved and blocks calendar dates
  const approveItem = async (itemType: "villa" | "car" | "yacht") => {
    if (!id || !booking) return;
    setSaving(true);
    try {
      const currentItem = booking[itemType];

      // Update the booking document
      await updateDoc(doc(db, "bookingRequests", id), {
        [`${itemType}.status`]: "Approved",
        updatedAt: Timestamp.now(),
      });

      // Block the dates on the inventory item
      if (currentItem?.id) {
        let datesToBlock: string[] = [];

        if (itemType === "villa" && booking.villa) {
          datesToBlock = getDateRange(booking.villa.checkIn, booking.villa.checkOut);
          await updateVilla(currentItem.id, { blockedDates: datesToBlock });
        } else if (itemType === "car" && booking.car) {
          datesToBlock = getDateRange(booking.car.pickupDate, booking.car.dropoffDate);
          await updateCar(currentItem.id, { blockedDates: datesToBlock });
        } else if (itemType === "yacht" && booking.yacht) {
          datesToBlock = [format(booking.yacht.date, "yyyy-MM-dd")];
          await updateYacht(currentItem.id, { blockedDates: datesToBlock });
        }
      }

      await logActivity(`Approved ${itemType}`);
    } catch (error) {
      console.error("Error approving item:", error);
    }
    setSaving(false);
  };

  // Decline an item
  const declineItem = async (itemType: "villa" | "car" | "yacht") => {
    if (!id || !booking) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "bookingRequests", id), {
        [`${itemType}.status`]: "Declined",
        updatedAt: Timestamp.now(),
      });

      await logActivity(`Declined ${itemType}`);
    } catch (error) {
      console.error("Error declining item:", error);
    }
    setSaving(false);
  };

  // Undo a decision - set back to Pending
  const undoDecision = async (itemType: "villa" | "car" | "yacht") => {
    if (!id || !booking) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "bookingRequests", id), {
        [`${itemType}.status`]: "Pending",
        updatedAt: Timestamp.now(),
      });

      await logActivity(`Reset ${itemType} to pending`);
    } catch (error) {
      console.error("Error undoing decision:", error);
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
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90"
            >
              Back to Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  const overallStatus = deriveBookingStatus(booking);

  // Item card component for villa/car/yacht
  const ItemCard = ({
    type,
    icon: Icon,
    iconColor,
    name,
    details,
    price,
    status,
  }: {
    type: "villa" | "car" | "yacht";
    icon: typeof Home;
    iconColor: string;
    name: string;
    details: React.ReactNode;
    price: number;
    status: ItemStatus;
  }) => (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{name}</h3>
            <p className="text-gray-400 text-sm capitalize">{type}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white font-semibold">${price.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">{details}</div>

      {/* Action buttons or status display */}
      <div className="pt-4 border-t border-border">
        {status === "Pending" ? (
          <div className="flex gap-3">
            <button
              onClick={() => approveItem(type)}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Approve
            </button>
            <button
              onClick={() => declineItem(type)}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Decline
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${itemStatusColors[status]}`}>
              {status === "Approved" && <Check className="h-4 w-4" />}
              {status === "Declined" && <X className="h-4 w-4" />}
              {status}
            </div>
            <button
              onClick={() => undoDecision(type)}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white text-sm transition-colors disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Undo
            </button>
          </div>
        )}
      </div>
    </div>
  );

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
          {/* Left column - 2/3 width */}
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
              </div>
            </div>

            {/* Villa */}
            {booking.villa && (
              <ItemCard
                type="villa"
                icon={Home}
                iconColor="bg-blue-500/20 text-blue-400"
                name={booking.villa.name}
                price={booking.villa.price}
                status={booking.villa.status || "Pending"}
                details={
                  <>
                    <div>
                      <p className="text-gray-400">Location</p>
                      <p className="text-white">{booking.villa.location}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Duration</p>
                      <p className="text-white">{booking.villa.nights} nights</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Check-in</p>
                      <p className="text-white">{format(booking.villa.checkIn, "MMM d, yyyy")}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Check-out</p>
                      <p className="text-white">{format(booking.villa.checkOut, "MMM d, yyyy")}</p>
                    </div>
                  </>
                }
              />
            )}

            {/* Car */}
            {booking.car && (
              <ItemCard
                type="car"
                icon={Car}
                iconColor="bg-purple-500/20 text-purple-400"
                name={booking.car.name}
                price={booking.car.price}
                status={booking.car.status || "Pending"}
                details={
                  <>
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
                  </>
                }
              />
            )}

            {/* Yacht */}
            {booking.yacht && (
              <ItemCard
                type="yacht"
                icon={Ship}
                iconColor="bg-cyan-500/20 text-cyan-400"
                name={booking.yacht.name}
                price={booking.yacht.price}
                status={booking.yacht.status || "Pending"}
                details={
                  <>
                    <div>
                      <p className="text-gray-400">Date</p>
                      <p className="text-white">{format(booking.yacht.date, "MMM d, yyyy")}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Time</p>
                      <p className="text-white">{booking.yacht.startTime} - {booking.yacht.endTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Duration</p>
                      <p className="text-white">{booking.yacht.hours} hours</p>
                    </div>
                  </>
                }
              />
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

          {/* Right column - 1/3 width */}
          <div className="space-y-6">
            {/* Overall Status */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Booking Status</h2>
              <div className={`inline-flex px-4 py-2 rounded-lg text-sm font-medium ${bookingStatusColors[overallStatus]}`}>
                {overallStatus}
              </div>
              <p className="text-gray-500 text-xs mt-3">
                Submitted {format(booking.createdAt, "MMM d, yyyy 'at' h:mm a")}
              </p>
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

            {/* Activity History */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-white">Activity</h2>
              </div>
              <div className="space-y-3 max-h-64 overflow-auto">
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
                {/* Created entry */}
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-300">Booking submitted</p>
                    <p className="text-xs text-gray-500">{format(booking.createdAt, "MMM d, yyyy 'at' h:mm a")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;
