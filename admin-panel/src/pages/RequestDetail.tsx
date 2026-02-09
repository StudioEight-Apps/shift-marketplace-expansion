import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc, deleteDoc, Timestamp, arrayUnion, increment, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import {
  ArrowLeft, Mail, Phone, Home, Car, Ship,
  Plus, Clock, Check, X, AlertCircle, RotateCcw, Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { hasPermission } from "@/lib/permissions";
import {
  deriveBookingStatus,
  getActiveTotal,
  formatPrice,
  formatDate,
  formatDateTime,
  getStatusVariant,
} from "@/lib/booking-utils";
import type { BookingRequest, ItemStatus } from "@/lib/types";
import {
  updateVilla, updateCar, updateYacht,
  getVillaById, getCarById, getYachtById,
} from "@/lib/listings";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// Local interface for Firestore-parsed booking (same shape as BookingRequest from types
// but with optional fields from Firestore)
interface FirestoreBooking {
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
    status: ItemStatus;
  } | null;
  car: {
    id?: string;
    name: string;
    pickupDate: Date;
    dropoffDate: Date;
    days: number;
    pricePerDay: number;
    price: number;
    status: ItemStatus;
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
    status: ItemStatus;
  } | null;
  grandTotal: number;
  notes: { text: string; author: string; timestamp: Date }[];
  activityLog: { action: string; actor: string; timestamp: Date; details?: string }[];
}

const RequestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [booking, setBooking] = useState<FirestoreBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canApproveDecline = role ? hasPermission(role, "approve_decline_items") : false;
  const canAddNotes = role ? hasPermission(role, "add_notes") : false;
  const canViewPii = role ? hasPermission(role, "view_pii") : false;

  // Real-time listener on booking document
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
              data.notes?.map(
                (n: { text: string; author: string; timestamp: { toDate: () => Date } }) => ({
                  ...n,
                  timestamp: n.timestamp?.toDate() || new Date(),
                })
              ) || [],
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

  // Helper to get date range as string array for calendar blocking
  const getDateRange = (start: Date, end: Date): string[] => {
    const dates: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(format(current, "yyyy-MM-dd"));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  // Find a listing document ID by name when the booking doesn't store the listing ID
  const findListingIdByName = async (
    collectionName: string,
    name: string
  ): Promise<string | null> => {
    const q = query(collection(db, collectionName), where("name", "==", name));
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].id;
    // Try trimmed match (Firestore names may have trailing spaces)
    const q2 = query(collection(db, collectionName), where("name", "==", name.trim()));
    const snap2 = await getDocs(q2);
    return snap2.empty ? null : snap2.docs[0].id;
  };

  // Resolve listing ID — use stored id or look up by name
  const resolveListingId = async (
    itemType: "villa" | "car" | "yacht",
    itemName: string,
    storedId?: string
  ): Promise<string | null> => {
    if (storedId) return storedId;
    const collectionMap = { villa: "villas", car: "cars", yacht: "yachts" };
    return findListingIdByName(collectionMap[itemType], itemName);
  };

  // Approve an item - sets status to Approved and MERGES calendar dates
  const approveItem = async (itemType: "villa" | "car" | "yacht") => {
    if (!id || !booking) return;
    setSaving(true);
    try {
      const currentItem = booking[itemType];

      // Update the booking document status
      await updateDoc(doc(db, "bookingRequests", id), {
        [`${itemType}.status`]: "Approved",
        updatedAt: Timestamp.now(),
      });

      // Block the dates on the inventory item — MERGE with existing blocked dates
      if (currentItem) {
        const listingId = await resolveListingId(
          itemType,
          currentItem.name,
          "id" in currentItem ? currentItem.id : undefined
        );

        if (listingId) {
          let newDatesToBlock: string[] = [];

          if (itemType === "villa" && booking.villa) {
            newDatesToBlock = getDateRange(booking.villa.checkIn, booking.villa.checkOut);
            const villaDoc = await getVillaById(listingId);
            const existing = villaDoc?.blockedDates || [];
            const merged = [...new Set([...existing, ...newDatesToBlock])];
            await updateVilla(listingId, { blockedDates: merged });
          } else if (itemType === "car" && booking.car) {
            newDatesToBlock = getDateRange(booking.car.pickupDate, booking.car.dropoffDate);
            const carDoc = await getCarById(listingId);
            const existing = carDoc?.blockedDates || [];
            const merged = [...new Set([...existing, ...newDatesToBlock])];
            await updateCar(listingId, { blockedDates: merged });
          } else if (itemType === "yacht" && booking.yacht) {
            newDatesToBlock = [format(booking.yacht.date, "yyyy-MM-dd")];
            const yachtDoc = await getYachtById(listingId);
            const existing = yachtDoc?.blockedDates || [];
            const merged = [...new Set([...existing, ...newDatesToBlock])];
            await updateYacht(listingId, { blockedDates: merged });
          }

          // Also store the resolved listing ID back on the booking for future use
          await updateDoc(doc(db, "bookingRequests", id), {
            [`${itemType}.id`]: listingId,
          });
        }
      }

      await logActivity(`Approved ${itemType}`);

      // Update customer's lifetime value
      if (booking.customer?.uid && currentItem && "price" in currentItem) {
        const price = currentItem.price || 0;
        try {
          await updateDoc(doc(db, "users", booking.customer.uid), {
            lifetimeValue: increment(price),
          });
        } catch (e) {
          console.error("Failed to update user LTV:", e);
        }
      }

      toast.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} approved`);
    } catch (error) {
      console.error("Error approving item:", error);
      toast.error("Failed to approve item");
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
      toast.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} declined`);
    } catch (error) {
      console.error("Error declining item:", error);
      toast.error("Failed to decline item");
    }
    setSaving(false);
  };

  // Undo a decision — also UNBLOCKS dates if previously approved
  const undoDecision = async (itemType: "villa" | "car" | "yacht") => {
    if (!id || !booking) return;
    setSaving(true);
    try {
      const currentItem = booking[itemType];
      const wasApproved = currentItem && "status" in currentItem && currentItem.status === "Approved";

      // Reset status to Pending
      await updateDoc(doc(db, "bookingRequests", id), {
        [`${itemType}.status`]: "Pending",
        updatedAt: Timestamp.now(),
      });

      // If the item was previously approved, remove booking dates from listing's blockedDates
      if (wasApproved && currentItem) {
        const listingId = await resolveListingId(
          itemType,
          currentItem.name,
          "id" in currentItem ? currentItem.id : undefined
        );

        if (listingId) {
          let datesToRemove: string[] = [];

          if (itemType === "villa" && booking.villa) {
            datesToRemove = getDateRange(booking.villa.checkIn, booking.villa.checkOut);
            const villaDoc = await getVillaById(listingId);
            const existing = villaDoc?.blockedDates || [];
            const filtered = existing.filter((d: string) => !datesToRemove.includes(d));
            await updateVilla(listingId, { blockedDates: filtered });
          } else if (itemType === "car" && booking.car) {
            datesToRemove = getDateRange(booking.car.pickupDate, booking.car.dropoffDate);
            const carDoc = await getCarById(listingId);
            const existing = carDoc?.blockedDates || [];
            const filtered = existing.filter((d: string) => !datesToRemove.includes(d));
            await updateCar(listingId, { blockedDates: filtered });
          } else if (itemType === "yacht" && booking.yacht) {
            datesToRemove = [format(booking.yacht.date, "yyyy-MM-dd")];
            const yachtDoc = await getYachtById(listingId);
            const existing = yachtDoc?.blockedDates || [];
            const filtered = existing.filter((d: string) => !datesToRemove.includes(d));
            await updateYacht(listingId, { blockedDates: filtered });
          }
        }
      }

      // If was approved, subtract from customer's lifetime value
      if (wasApproved && booking.customer?.uid && currentItem && "price" in currentItem) {
        const price = currentItem.price || 0;
        try {
          await updateDoc(doc(db, "users", booking.customer.uid), {
            lifetimeValue: increment(-price),
          });
        } catch (e) {
          console.error("Failed to update user LTV:", e);
        }
      }

      await logActivity(`Reset ${itemType} to pending`);
      toast.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} reset to pending`);
    } catch (error) {
      console.error("Error undoing decision:", error);
      toast.error("Failed to undo decision");
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
      toast.success("Note added");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    }
    setSaving(false);
  };

  const handleDeleteBooking = async () => {
    if (!id || !booking) return;
    setDeleting(true);
    try {
      // Unblock dates for any approved items before deleting
      const itemTypes: ("villa" | "car" | "yacht")[] = ["villa", "car", "yacht"];
      for (const itemType of itemTypes) {
        const item = booking[itemType];
        if (!item || item.status !== "Approved") continue;

        try {
          const listingId = await resolveListingId(
            itemType,
            item.name,
            "id" in item ? item.id : undefined
          );

          if (listingId) {
            let datesToRemove: string[] = [];

            if (itemType === "villa" && booking.villa) {
              datesToRemove = getDateRange(booking.villa.checkIn, booking.villa.checkOut);
              const villaDoc = await getVillaById(listingId);
              const existing = villaDoc?.blockedDates || [];
              const filtered = existing.filter((d: string) => !datesToRemove.includes(d));
              await updateVilla(listingId, { blockedDates: filtered });
            } else if (itemType === "car" && booking.car) {
              datesToRemove = getDateRange(booking.car.pickupDate, booking.car.dropoffDate);
              const carDoc = await getCarById(listingId);
              const existing = carDoc?.blockedDates || [];
              const filtered = existing.filter((d: string) => !datesToRemove.includes(d));
              await updateCar(listingId, { blockedDates: filtered });
            } else if (itemType === "yacht" && booking.yacht) {
              datesToRemove = [format(booking.yacht.date, "yyyy-MM-dd")];
              const yachtDoc = await getYachtById(listingId);
              const existing = yachtDoc?.blockedDates || [];
              const filtered = existing.filter((d: string) => !datesToRemove.includes(d));
              await updateYacht(listingId, { blockedDates: filtered });
            }
          }
        } catch (e) {
          console.error(`Failed to unblock dates for ${itemType}:`, e);
        }
      }

      // Subtract LTV if any items were approved
      if (booking.customer?.uid) {
        let approvedTotal = 0;
        if (booking.villa?.status === "Approved") approvedTotal += booking.villa.price || 0;
        if (booking.car?.status === "Approved") approvedTotal += booking.car.price || 0;
        if (booking.yacht?.status === "Approved") approvedTotal += booking.yacht.price || 0;
        if (approvedTotal > 0) {
          try {
            await updateDoc(doc(db, "users", booking.customer.uid), {
              lifetimeValue: increment(-approvedTotal),
            });
          } catch (e) {
            console.error("Failed to update user LTV:", e);
          }
        }
      }

      await deleteDoc(doc(db, "bookingRequests", id));
      toast.success("Booking deleted");
      navigate("/");
    } catch (err) {
      console.error("Error deleting booking:", err);
      toast.error("Failed to delete booking");
    }
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-border px-6 py-4">
          <h1 className="text-lg font-semibold text-foreground">Loading...</h1>
        </div>
        <div className="p-6 text-muted-foreground">Loading booking details...</div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-border px-6 py-4">
          <h1 className="text-lg font-semibold text-foreground">Error</h1>
        </div>
        <div className="p-6">
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-destructive text-lg">{error || "Booking not found"}</p>
            <Button onClick={() => navigate("/")} variant="outline">
              Back to Bookings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Derive statuses
  const bookingForUtils: BookingRequest = {
    id: booking.id,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt || booking.createdAt,
    customer: { uid: booking.customer.uid, name: booking.customer.name, email: booking.customer.email, phone: booking.customer.phone },
    villa: booking.villa ? { id: booking.villa.id || "", name: booking.villa.name, location: booking.villa.location, checkIn: booking.villa.checkIn, checkOut: booking.villa.checkOut, nights: booking.villa.nights, pricePerNight: booking.villa.pricePerNight, price: booking.villa.price, status: booking.villa.status } : null,
    car: booking.car ? { id: booking.car.id || "", name: booking.car.name, pickupDate: booking.car.pickupDate, dropoffDate: booking.car.dropoffDate, days: booking.car.days, pricePerDay: booking.car.pricePerDay, price: booking.car.price, status: booking.car.status } : null,
    yacht: booking.yacht ? { id: booking.yacht.id || "", name: booking.yacht.name, date: booking.yacht.date, startTime: booking.yacht.startTime, endTime: booking.yacht.endTime, hours: booking.yacht.hours, pricePerHour: booking.yacht.pricePerHour, price: booking.yacht.price, status: booking.yacht.status } : null,
    grandTotal: booking.grandTotal,
    notes: booking.notes,
    activityLog: booking.activityLog,
  };

  const overallStatus = deriveBookingStatus(bookingForUtils);
  const activeTotal = getActiveTotal(bookingForUtils);

  // Item card component
  const ItemCard = ({
    type,
    icon: Icon,
    name,
    details,
    price,
    status,
  }: {
    type: "villa" | "car" | "yacht";
    icon: typeof Home;
    name: string;
    details: React.ReactNode;
    price: number;
    status: ItemStatus;
  }) => {
    const isDeclined = status === "Declined";

    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              type === "villa" && "bg-blue-500/10 text-blue-500",
              type === "car" && "bg-purple-500/10 text-purple-500",
              type === "yacht" && "bg-cyan-500/10 text-cyan-500",
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-foreground font-semibold">{name}</h3>
              <p className="text-muted-foreground text-sm capitalize">{type}</p>
            </div>
          </div>
          <div className="text-right flex items-center gap-2">
            <Badge variant={getStatusVariant(status)}>
              {status}
            </Badge>
            <p className={cn("font-semibold", isDeclined ? "text-muted-foreground line-through" : "text-foreground")}>
              {formatPrice(price)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">{details}</div>

        {/* Action buttons or undo */}
        {canApproveDecline && (
          <div className="pt-4 border-t border-border">
            {status === "Pending" ? (
              <div className="flex gap-3">
                <Button
                  onClick={() => approveItem(type)}
                  disabled={saving}
                  className="flex-1 bg-status-approved hover:bg-status-approved/90 text-white"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  onClick={() => declineItem(type)}
                  disabled={saving}
                  variant="outline"
                  className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-end">
                <Button
                  onClick={() => undoDecision(type)}
                  disabled={saving}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Undo
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Booking {booking.id.slice(0, 8)}...
            </h1>
            <p className="text-xs text-muted-foreground">
              Submitted {formatDateTime(booking.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={getStatusVariant(overallStatus)} className="text-sm px-3 py-1">
            {overallStatus}
          </Badge>
          {canApproveDecline && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Customer</h2>
              <div className="space-y-3">
                <p className="text-xl font-medium text-foreground">{booking.customer.name}</p>
                {canViewPii ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>Email hidden</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>Phone hidden</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Villa */}
            {booking.villa && (
              <ItemCard
                type="villa"
                icon={Home}
                name={booking.villa.name}
                price={booking.villa.price}
                status={booking.villa.status}
                details={
                  <>
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="text-foreground">{booking.villa.location}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="text-foreground">{booking.villa.nights} nights</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Check-in</p>
                      <p className="text-foreground">{formatDate(booking.villa.checkIn)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Check-out</p>
                      <p className="text-foreground">{formatDate(booking.villa.checkOut)}</p>
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
                name={booking.car.name}
                price={booking.car.price}
                status={booking.car.status}
                details={
                  <>
                    <div>
                      <p className="text-muted-foreground">Pick-up</p>
                      <p className="text-foreground">{formatDate(booking.car.pickupDate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Drop-off</p>
                      <p className="text-foreground">{formatDate(booking.car.dropoffDate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="text-foreground">{booking.car.days} days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rate</p>
                      <p className="text-foreground">{formatPrice(booking.car.pricePerDay)}/day</p>
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
                name={booking.yacht.name}
                price={booking.yacht.price}
                status={booking.yacht.status}
                details={
                  <>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="text-foreground">{formatDate(booking.yacht.date)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Time</p>
                      <p className="text-foreground">{booking.yacht.startTime} - {booking.yacht.endTime}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="text-foreground">{booking.yacht.hours} hours</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rate</p>
                      <p className="text-foreground">{formatPrice(booking.yacht.pricePerHour)}/hr</p>
                    </div>
                  </>
                }
              />
            )}

            {/* Notes */}
            {canAddNotes && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Internal Notes</h2>

                <div className="space-y-3 mb-4">
                  {booking.notes && booking.notes.length > 0 ? (
                    booking.notes
                      .slice()
                      .reverse()
                      .map((note, i) => (
                        <div key={i} className="bg-background rounded-lg p-3">
                          <p className="text-foreground text-sm">{note.text}</p>
                          <p className="text-muted-foreground text-xs mt-1">
                            {note.author} · {format(note.timestamp, "MMM d, h:mm a")}
                          </p>
                        </div>
                      ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No notes yet</p>
                  )}
                </div>

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
                    size="sm"
                    className="px-4"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right column - 1/3 width */}
          <div className="space-y-6">
            {/* Pricing */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Pricing</h2>
              <div className="space-y-2 text-sm">
                {booking.villa && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Villa</span>
                    <span className={cn(
                      booking.villa.status === "Declined" ? "text-muted-foreground line-through" : "text-foreground"
                    )}>
                      {formatPrice(booking.villa.price)}
                    </span>
                  </div>
                )}
                {booking.car && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Car</span>
                    <span className={cn(
                      booking.car.status === "Declined" ? "text-muted-foreground line-through" : "text-foreground"
                    )}>
                      {formatPrice(booking.car.price)}
                    </span>
                  </div>
                )}
                {booking.yacht && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Yacht</span>
                    <span className={cn(
                      booking.yacht.status === "Declined" ? "text-muted-foreground line-through" : "text-foreground"
                    )}>
                      {formatPrice(booking.yacht.price)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-foreground font-medium">Active Total</span>
                  <div className="text-right">
                    <span className="text-primary font-bold text-lg">
                      {formatPrice(activeTotal)}
                    </span>
                    {activeTotal !== booking.grandTotal && (
                      <span className="text-muted-foreground line-through text-xs ml-2">
                        {formatPrice(booking.grandTotal)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Activity History */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">Activity</h2>
              </div>
              <div className="space-y-3 max-h-64 overflow-auto">
                {booking.activityLog &&
                  booking.activityLog
                    .slice()
                    .reverse()
                    .map((activity, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-foreground">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.actor} · {format(activity.timestamp, "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))}
                {/* Created entry */}
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-status-approved mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">Booking submitted</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(booking.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Booking Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Booking
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to permanently delete this booking from{" "}
              <strong className="text-foreground">{booking.customer.name}</strong>?
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="border-border text-foreground hover:bg-muted"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={handleDeleteBooking}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete Booking"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RequestDetail;

