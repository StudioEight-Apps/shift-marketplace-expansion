import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, doc, query, where, onSnapshot, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { ArrowLeft, Mail, Phone, Calendar, Home, Car, Ship, ChevronDown, ChevronRight, Plus, AlertCircle, RefreshCw } from "lucide-react";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import {
  LineItemStatus,
  deriveTripStatus,
  tripStatusColors,
} from "@/lib/bookingStatus";

interface BookingRequest {
  id: string;
  status: string;
  createdAt: Date;
  paymentCollected?: boolean;
  readyToCollect?: boolean;
  villa: {
    name: string;
    checkIn: Date;
    checkOut: Date;
    nights: number;
    price: number;
    location: string;
    status?: LineItemStatus;
  } | null;
  car: {
    name: string;
    pickupDate: Date;
    dropoffDate: Date;
    days: number;
    price: number;
    status?: LineItemStatus;
  } | null;
  yacht: {
    name: string;
    date: Date;
    startTime: string;
    endTime: string;
    hours: number;
    price: number;
    status?: LineItemStatus;
  } | null;
  grandTotal: number;
  activityLog?: { action: string; actor: string; timestamp: Date }[];
}

interface UserNote {
  text: string;
  author: string;
  timestamp: Date;
}

interface ActivityEvent {
  type: "trip_requested" | "payment_ready" | "payment_collected" | "trip_cancelled" | "trip_closed";
  description: string;
  timestamp: Date;
  bookingId?: string;
}

interface UserInfo {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: Date;
  lifetimeValue?: number;
  notes?: UserNote[];
}

const lineItemStatusColors: Record<LineItemStatus, string> = {
  Unverified: "bg-gray-500/20 text-gray-400",
  Verified: "bg-blue-500/20 text-blue-400",
  Booked: "bg-green-500/20 text-green-400",
  Unavailable: "bg-red-500/20 text-red-400",
};

type TabType = "profile" | "trips" | "activity";

const UserDetail = () => {
  const { id: userId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: adminUser } = useAuth();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set());
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingLifetimeValue, setEditingLifetimeValue] = useState(false);
  const [lifetimeValueInput, setLifetimeValueInput] = useState("");

  // Fetch user from users collection
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", userId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUser({
            uid: docSnap.id,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
            phone: data.phone || "",
            createdAt: data.createdAt?.toDate() || new Date(),
            lifetimeValue: data.lifetimeValue || 0,
            notes:
              data.notes?.map((n: { text: string; author: string; timestamp: { toDate: () => Date } }) => ({
                ...n,
                timestamp: n.timestamp?.toDate() || new Date(),
              })) || [],
          });
          setLifetimeValueInput(data.lifetimeValue?.toString() || "");
          setError(null);
        } else {
          setError("User not found");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching user:", err);
        setError("Failed to load user. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Fetch bookings for this user
  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, "bookingRequests"), where("customer.uid", "==", userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const requests: BookingRequest[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            status: data.status || "Pending",
            createdAt: data.createdAt?.toDate() || new Date(),
            paymentCollected: data.paymentCollected || false,
            readyToCollect: data.readyToCollect || false,
            villa: data.villa
              ? {
                  name: data.villa.name,
                  checkIn: data.villa.checkIn?.toDate() || new Date(),
                  checkOut: data.villa.checkOut?.toDate() || new Date(),
                  nights: data.villa.nights || 0,
                  price: data.villa.price || 0,
                  location: data.villa.location || "",
                  status: data.villa.status || "Unverified",
                }
              : null,
            car: data.car
              ? {
                  name: data.car.name,
                  pickupDate: data.car.pickupDate?.toDate() || new Date(),
                  dropoffDate: data.car.dropoffDate?.toDate() || new Date(),
                  days: data.car.days || 0,
                  price: data.car.price || 0,
                  status: data.car.status || "Unverified",
                }
              : null,
            yacht: data.yacht
              ? {
                  name: data.yacht.name,
                  date: data.yacht.date?.toDate() || new Date(),
                  startTime: data.yacht.startTime || "",
                  endTime: data.yacht.endTime || "",
                  hours: data.yacht.hours || 0,
                  price: data.yacht.price || 0,
                  status: data.yacht.status || "Unverified",
                }
              : null,
            grandTotal: data.grandTotal || 0,
            activityLog:
              data.activityLog?.map((a: { action: string; actor: string; timestamp: { toDate: () => Date } }) => ({
                ...a,
                timestamp: a.timestamp?.toDate() || new Date(),
              })) || [],
          };
        });

        requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setBookings(requests);
      },
      (err) => {
        console.error("Error fetching bookings:", err);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Generate activity events from bookings
  const getActivityEvents = (): ActivityEvent[] => {
    const events: ActivityEvent[] = [];

    bookings.forEach((booking) => {
      // Trip requested
      events.push({
        type: "trip_requested",
        description: `Trip request submitted - $${booking.grandTotal.toLocaleString()}`,
        timestamp: booking.createdAt,
        bookingId: booking.id,
      });

      // Check activity log for payment events
      booking.activityLog?.forEach((log) => {
        if (log.action.toLowerCase().includes("ready to collect")) {
          events.push({
            type: "payment_ready",
            description: "Marked ready to collect payment",
            timestamp: log.timestamp,
            bookingId: booking.id,
          });
        }
        if (log.action.toLowerCase().includes("payment collected")) {
          events.push({
            type: "payment_collected",
            description: "Payment collected",
            timestamp: log.timestamp,
            bookingId: booking.id,
          });
        }
        if (log.action.toLowerCase().includes("cancelled")) {
          events.push({
            type: "trip_cancelled",
            description: "Trip cancelled",
            timestamp: log.timestamp,
            bookingId: booking.id,
          });
        }
        if (log.action.toLowerCase().includes("closed")) {
          events.push({
            type: "trip_closed",
            description: "Trip closed",
            timestamp: log.timestamp,
            bookingId: booking.id,
          });
        }
      });
    });

    // Sort by timestamp descending
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return events;
  };

  const toggleBookingExpanded = (bookingId: string) => {
    setExpandedBookings((prev) => {
      const next = new Set(prev);
      if (next.has(bookingId)) {
        next.delete(bookingId);
      } else {
        next.add(bookingId);
      }
      return next;
    });
  };

  const addNote = async () => {
    if (!userId || !newNote.trim()) return;
    setSaving(true);
    try {
      const note = {
        text: newNote.trim(),
        author: adminUser?.email || "Admin",
        timestamp: Timestamp.now(),
      };
      const currentNotes =
        user?.notes?.map((n) => ({
          ...n,
          timestamp: Timestamp.fromDate(n.timestamp),
        })) || [];
      await updateDoc(doc(db, "users", userId), {
        notes: [...currentNotes, note],
      });
      setNewNote("");
    } catch (err) {
      console.error("Error adding note:", err);
    }
    setSaving(false);
  };

  const saveLifetimeValue = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const value = parseFloat(lifetimeValueInput) || 0;
      await updateDoc(doc(db, "users", userId), {
        lifetimeValue: value,
      });
      setEditingLifetimeValue(false);
    } catch (err) {
      console.error("Error updating lifetime value:", err);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Loading..." />
        <div className="p-6 text-gray-500">Loading user details...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Error" />
        <div className="p-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <p className="text-red-400 text-lg">{error || "User not found"}</p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/users")}
                className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30"
              >
                Back to Users
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim() || "Unknown User";

  const tabs: { id: TabType; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "trips", label: "Trips" },
    { id: "activity", label: "Activity" },
  ];

  const activityEvents = getActivityEvents();

  return (
    <div className="flex flex-col h-full">
      <Header title={fullName} />

      <div className="p-6 space-y-6 overflow-auto">
        {/* Back button */}
        <button
          onClick={() => navigate("/users")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </button>

        {/* Tabs */}
        <div className="flex gap-1 bg-card border border-border rounded-lg p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id ? "bg-primary text-black" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-2 gap-6">
            {/* Contact Info */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Contact Info</h2>
              <div className="space-y-3">
                <p className="text-xl font-medium text-white">{fullName}</p>
                <a href={`mailto:${user.email}`} className="flex items-center gap-2 text-primary hover:underline">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </a>
                <a href={`tel:${user.phone}`} className="flex items-center gap-2 text-primary hover:underline">
                  <Phone className="h-4 w-4" />
                  {user.phone || "No phone"}
                </a>
                <div className="flex items-center gap-2 text-gray-400 pt-2">
                  <Calendar className="h-4 w-4" />
                  Customer since {format(user.createdAt, "MMM yyyy")}
                </div>
              </div>
            </div>

            {/* Lifetime Value & Stats */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Customer Value</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Lifetime Value</p>
                  {editingLifetimeValue ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={lifetimeValueInput}
                        onChange={(e) => setLifetimeValueInput(e.target.value)}
                        className="w-32 px-3 py-1.5 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-primary"
                        placeholder="0"
                      />
                      <button
                        onClick={saveLifetimeValue}
                        disabled={saving}
                        className="px-3 py-1.5 bg-primary text-black text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingLifetimeValue(false);
                          setLifetimeValueInput(user.lifetimeValue?.toString() || "");
                        }}
                        className="px-3 py-1.5 text-gray-400 text-sm hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-primary">${(user.lifetimeValue || 0).toLocaleString()}</p>
                      <button onClick={() => setEditingLifetimeValue(true)} className="text-xs text-gray-500 hover:text-white">
                        Edit
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Trips</p>
                  <p className="text-2xl font-bold text-white">{bookings.length}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="col-span-2 bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Notes</h2>

              <div className="flex gap-2 mb-4">
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

              <div className="space-y-3">
                {user.notes && user.notes.length > 0 ? (
                  user.notes
                    .slice()
                    .reverse()
                    .map((note, i) => (
                      <div key={i} className="bg-background rounded-lg p-3">
                        <p className="text-white text-sm">{note.text}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {note.author} · {format(note.timestamp, "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-500 text-sm">No notes yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "trips" && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center text-gray-500">No trips found for this user</div>
            ) : (
              bookings.map((booking) => {
                const isExpanded = expandedBookings.has(booking.id);
                const tripStatus = deriveTripStatus(booking);
                const lineItems: { type: string; name: string; status: LineItemStatus; price: number; details: string }[] = [];

                if (booking.villa) {
                  lineItems.push({
                    type: "Villa",
                    name: booking.villa.name,
                    status: booking.villa.status || "Unverified",
                    price: booking.villa.price,
                    details: `${format(booking.villa.checkIn, "MMM d")} - ${format(booking.villa.checkOut, "MMM d, yyyy")} (${booking.villa.nights} nights)`,
                  });
                }
                if (booking.car) {
                  lineItems.push({
                    type: "Car",
                    name: booking.car.name,
                    status: booking.car.status || "Unverified",
                    price: booking.car.price,
                    details: `${format(booking.car.pickupDate, "MMM d")} - ${format(booking.car.dropoffDate, "MMM d, yyyy")} (${booking.car.days} days)`,
                  });
                }
                if (booking.yacht) {
                  lineItems.push({
                    type: "Yacht",
                    name: booking.yacht.name,
                    status: booking.yacht.status || "Unverified",
                    price: booking.yacht.price,
                    details: `${format(booking.yacht.date, "MMM d, yyyy")} ${booking.yacht.startTime} - ${booking.yacht.endTime}`,
                  });
                }

                return (
                  <div key={booking.id} className="bg-card border border-border rounded-xl overflow-hidden">
                    {/* Trip Header */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => toggleBookingExpanded(booking.id)}
                    >
                      <div className="flex items-center gap-4">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <p className="text-white font-medium">Trip #{booking.id.slice(0, 8)}</p>
                          <p className="text-gray-500 text-sm">
                            {format(booking.createdAt, "MMM d, yyyy")} · {lineItems.length} item{lineItems.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tripStatusColors[tripStatus]}`}>
                          {tripStatus}
                        </span>
                        <p className="text-white font-medium">${booking.grandTotal.toLocaleString()}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/requests/${booking.id}`);
                          }}
                          className="text-primary text-sm hover:underline"
                        >
                          Open
                        </button>
                      </div>
                    </div>

                    {/* Expanded Line Items */}
                    {isExpanded && (
                      <div className="border-t border-border">
                        {lineItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between px-6 py-3 border-b border-border last:border-b-0 bg-background/50"
                          >
                            <div className="flex items-center gap-3">
                              {item.type === "Villa" && <Home className="h-4 w-4 text-blue-400" />}
                              {item.type === "Car" && <Car className="h-4 w-4 text-purple-400" />}
                              {item.type === "Yacht" && <Ship className="h-4 w-4 text-cyan-400" />}
                              <div>
                                <p className="text-white text-sm">{item.name}</p>
                                <p className="text-gray-500 text-xs">{item.details}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${lineItemStatusColors[item.status]}`}>
                                {item.status}
                              </span>
                              <p className="text-gray-400 text-sm">${item.price.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Key Events</h2>
            <div className="space-y-4">
              {activityEvents.length === 0 ? (
                <p className="text-gray-500 text-sm">No activity yet</p>
              ) : (
                activityEvents.map((event, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        event.type === "trip_requested"
                          ? "bg-green-500"
                          : event.type === "payment_collected"
                            ? "bg-primary"
                            : event.type === "payment_ready"
                              ? "bg-amber-500"
                              : event.type === "trip_cancelled"
                                ? "bg-red-500"
                                : "bg-gray-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-300">{event.description}</p>
                      <p className="text-xs text-gray-500">{format(event.timestamp, "MMM d, yyyy 'at' h:mm a")}</p>
                    </div>
                    {event.bookingId && (
                      <button
                        onClick={() => navigate(`/requests/${event.bookingId}`)}
                        className="text-xs text-primary hover:underline"
                      >
                        View Trip
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetail;
