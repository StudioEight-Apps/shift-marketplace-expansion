import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { hasPermission, maskEmail, maskPhone } from "@/lib/permissions";
import { formatDate, formatPrice, formatDateTime } from "@/lib/booking-utils";
import {
  ItemStatus,
  deriveBookingStatus,
  bookingStatusColors,
  itemStatusColors,
} from "@/lib/bookingStatus";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Home,
  Car,
  Ship,
  ChevronDown,
  ChevronRight,
  Plus,
  User,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ---- Interfaces ----

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
    status?: ItemStatus;
  } | null;
  car: {
    name: string;
    pickupDate: Date;
    dropoffDate: Date;
    days: number;
    price: number;
    status?: ItemStatus;
  } | null;
  yacht: {
    name: string;
    date: Date;
    startTime: string;
    endTime: string;
    hours: number;
    price: number;
    status?: ItemStatus;
  } | null;
  grandTotal: number;
  activityLog?: { action: string; actor: string; timestamp: Date }[];
}

interface UserNote {
  text: string;
  author: string;
  timestamp: Date;
}

interface UserInfo {
  uid: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: Date;
  lifetimeValue: number;
  totalTrips: number;
  status: "active" | "deactivated";
  notes: UserNote[];
}

const UserDetail = () => {
  const { id: userId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: adminUser, role } = useAuth();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set());
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  const canViewPii = role ? hasPermission(role, "view_pii") : false;
  const canAddNotes = role ? hasPermission(role, "add_user_notes") : false;
  const canEditLtv = role ? hasPermission(role, "edit_lifetime_value") : false;

  // ---- Fetch user doc ----
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", userId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const name =
            data.name ||
            `${data.firstName || ""} ${data.lastName || ""}`.trim() ||
            "Unknown";
          setUser({
            uid: docSnap.id,
            name,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
            phone: data.phone || "",
            createdAt: data.createdAt?.toDate() || new Date(),
            lifetimeValue: data.lifetimeValue || 0,
            totalTrips: data.totalTrips || 0,
            status: data.status || "active",
            notes:
              data.notes?.map(
                (n: { text: string; author: string; timestamp: { toDate: () => Date } }) => ({
                  ...n,
                  timestamp: n.timestamp?.toDate() || new Date(),
                })
              ) || [],
          });
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

  // ---- Fetch bookings for this user ----
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "bookingRequests"),
      where("customer.uid", "==", userId)
    );

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
                  status: data.villa.status || "Pending",
                }
              : null,
            car: data.car
              ? {
                  name: data.car.name,
                  pickupDate: data.car.pickupDate?.toDate() || new Date(),
                  dropoffDate: data.car.dropoffDate?.toDate() || new Date(),
                  days: data.car.days || 0,
                  price: data.car.price || 0,
                  status: data.car.status || "Pending",
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
                  status: data.yacht.status || "Pending",
                }
              : null,
            grandTotal: data.grandTotal || 0,
            activityLog:
              data.activityLog?.map(
                (a: { action: string; actor: string; timestamp: { toDate: () => Date } }) => ({
                  ...a,
                  timestamp: a.timestamp?.toDate() || new Date(),
                })
              ) || [],
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

  // ---- Add note ----
  const addNote = async () => {
    if (!userId || !newNote.trim() || !canAddNotes) return;
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
      toast.success("Note added");
    } catch (err) {
      console.error("Error adding note:", err);
      toast.error("Failed to add note");
    }
    setSaving(false);
  };

  // ---- Toggle booking expansion ----
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

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Loading..." />
        <div className="p-6 text-muted-foreground">Loading user details...</div>
      </div>
    );
  }

  // ---- Error state ----
  if (error || !user) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Error" />
        <div className="p-6">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 flex flex-col items-center gap-4">
              <p className="text-destructive text-lg">{error || "User not found"}</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate("/users")}>
                  Back to Users
                </Button>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const fullName = user.name || "Unknown User";

  return (
    <div className="flex flex-col h-full">
      <Header title={fullName} />

      <div className="p-6 space-y-6 overflow-auto">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/users")}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Button>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="bookings">
              Bookings ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value="notes">
              Notes ({user.notes?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* ========== PROFILE TAB ========== */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{fullName}</p>
                      <Badge
                        variant={user.status === "active" ? "approved" : "declined"}
                        className="mt-1"
                      >
                        {user.status === "active" ? "Active" : "Deactivated"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="text-foreground">
                        {canViewPii ? user.email : maskEmail(user.email)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span className="text-foreground">
                        {user.phone
                          ? canViewPii
                            ? user.phone
                            : maskPhone(user.phone)
                          : "No phone"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>Customer since {formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Value</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Lifetime Value</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatPrice(user.lifetimeValue || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Trips</p>
                    <p className="text-3xl font-bold text-foreground">
                      {user.totalTrips || bookings.length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ========== BOOKINGS TAB ========== */}
          <TabsContent value="bookings">
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No bookings found for this user
                  </CardContent>
                </Card>
              ) : (
                bookings.map((booking) => {
                  const isExpanded = expandedBookings.has(booking.id);
                  const bookingStatus = deriveBookingStatus(booking);
                  const lineItems: {
                    type: string;
                    name: string;
                    status: ItemStatus;
                    price: number;
                    details: string;
                  }[] = [];

                  if (booking.villa) {
                    lineItems.push({
                      type: "Villa",
                      name: booking.villa.name,
                      status: booking.villa.status || "Pending",
                      price: booking.villa.price,
                      details: `${formatDate(booking.villa.checkIn)} - ${formatDate(booking.villa.checkOut)} (${booking.villa.nights} nights)`,
                    });
                  }
                  if (booking.car) {
                    lineItems.push({
                      type: "Car",
                      name: booking.car.name,
                      status: booking.car.status || "Pending",
                      price: booking.car.price,
                      details: `${formatDate(booking.car.pickupDate)} - ${formatDate(booking.car.dropoffDate)} (${booking.car.days} days)`,
                    });
                  }
                  if (booking.yacht) {
                    lineItems.push({
                      type: "Yacht",
                      name: booking.yacht.name,
                      status: booking.yacht.status || "Pending",
                      price: booking.yacht.price,
                      details: `${formatDate(booking.yacht.date)} ${booking.yacht.startTime} - ${booking.yacht.endTime}`,
                    });
                  }

                  return (
                    <Card key={booking.id} className="overflow-hidden">
                      {/* Booking Header */}
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleBookingExpanded(booking.id)}
                      >
                        <div className="flex items-center gap-4">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-foreground font-medium">
                              Trip #{booking.id.slice(0, 8)}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {formatDate(booking.createdAt)} &middot; {lineItems.length} item
                              {lineItems.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-medium",
                              bookingStatusColors[bookingStatus]
                            )}
                          >
                            {bookingStatus}
                          </span>
                          <p className="text-foreground font-medium">
                            {formatPrice(booking.grandTotal)}
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/requests/${booking.id}`);
                            }}
                          >
                            Open
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Line Items */}
                      {isExpanded && (
                        <div className="border-t border-border">
                          {lineItems.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between px-6 py-3 border-b border-border last:border-b-0 bg-muted/30"
                            >
                              <div className="flex items-center gap-3">
                                {item.type === "Villa" && (
                                  <Home className="h-4 w-4 text-blue-400" />
                                )}
                                {item.type === "Car" && (
                                  <Car className="h-4 w-4 text-purple-400" />
                                )}
                                {item.type === "Yacht" && (
                                  <Ship className="h-4 w-4 text-cyan-400" />
                                )}
                                <div>
                                  <p className="text-foreground text-sm">{item.name}</p>
                                  <p className="text-muted-foreground text-xs">{item.details}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded text-xs font-medium",
                                    itemStatusColors[item.status]
                                  )}
                                >
                                  {item.status}
                                </span>
                                <p className="text-muted-foreground text-sm">
                                  {formatPrice(item.price)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* ========== NOTES TAB ========== */}
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
                <CardDescription>
                  Internal notes about this customer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add note form */}
                {canAddNotes && (
                  <div className="flex gap-2">
                    <Input
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note..."
                      onKeyDown={(e) => e.key === "Enter" && addNote()}
                    />
                    <Button
                      onClick={addNote}
                      disabled={saving || !newNote.trim()}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                )}

                {/* Notes list */}
                <div className="space-y-3">
                  {user.notes && user.notes.length > 0 ? (
                    user.notes
                      .slice()
                      .reverse()
                      .map((note, i) => (
                        <div
                          key={i}
                          className="rounded-lg border bg-muted/30 p-3"
                        >
                          <p className="text-foreground text-sm">{note.text}</p>
                          <p className="text-muted-foreground text-xs mt-1">
                            {note.author} &middot;{" "}
                            {formatDateTime(note.timestamp)}
                          </p>
                        </div>
                      ))
                  ) : (
                    <p className="text-muted-foreground text-sm py-4 text-center">
                      No notes yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserDetail;
