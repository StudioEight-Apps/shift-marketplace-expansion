import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { hasPermission, maskEmail } from "@/lib/permissions";
import {
  deriveBookingStatus,
  formatDate,
  formatPrice,
  getActiveTotal,
  getStatusVariant,
} from "@/lib/booking-utils";
import { format, formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Home, Car, Ship, Search, ChevronRight, Download, Trash2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingRequest, BookingStatus, ItemStatus } from "@/lib/types";

type SortOption = "newest" | "oldest" | "price-high" | "price-low" | "checkin-soon";

const statusFilters: (BookingStatus | "All")[] = [
  "All", "Pending", "Approved", "Partial", "Completed", "Declined",
];

function ItemIcon({ type, className }: { type: "villa" | "car" | "yacht"; className?: string }) {
  switch (type) {
    case "villa": return <Home className={cn("h-3.5 w-3.5", className)} />;
    case "car": return <Car className={cn("h-3.5 w-3.5", className)} />;
    case "yacht": return <Ship className={cn("h-3.5 w-3.5", className)} />;
  }
}

function StatusDot({ status }: { status: ItemStatus }) {
  const colors: Record<ItemStatus, string> = {
    Approved: "bg-status-approved",
    Declined: "bg-status-declined",
    Pending: "bg-status-pending",
  };
  return <div className={cn("h-1.5 w-1.5 rounded-full", colors[status])} />;
}

function getEarliestDate(b: BookingRequest): Date {
  const dates: Date[] = [];
  if (b.villa) dates.push(b.villa.checkIn);
  if (b.car) dates.push(b.car.pickupDate);
  if (b.yacht) dates.push(b.yacht.date);
  return dates.length > 0
    ? dates.sort((a, b) => a.getTime() - b.getTime())[0]
    : new Date(0);
}

const Dashboard = () => {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "All">("All");
  const [sort, setSort] = useState<SortOption>("newest");
  const navigate = useNavigate();
  const { role } = useAuth();

  const showPII = role ? hasPermission(role, "view_pii") : false;

  useEffect(() => {
    const q = query(collection(db, "bookingRequests"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const requests: BookingRequest[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date(),
            customer: data.customer || { uid: "", name: "Unknown", email: "", phone: "" },
            villa: data.villa
              ? {
                  id: data.villa.id || "",
                  name: data.villa.name || "",
                  location: data.villa.location || "",
                  checkIn: data.villa.checkIn?.toDate() || new Date(),
                  checkOut: data.villa.checkOut?.toDate() || new Date(),
                  nights: data.villa.nights || 0,
                  pricePerNight: data.villa.pricePerNight || 0,
                  price: data.villa.price || 0,
                  status: data.villa.status || "Pending",
                }
              : null,
            car: data.car
              ? {
                  id: data.car.id || "",
                  name: data.car.name || "",
                  location: data.car.location || "",
                  pickupDate: data.car.pickupDate?.toDate() || new Date(),
                  dropoffDate: data.car.dropoffDate?.toDate() || new Date(),
                  days: data.car.days || 0,
                  pricePerDay: data.car.pricePerDay || 0,
                  price: data.car.price || 0,
                  status: data.car.status || "Pending",
                }
              : null,
            yacht: data.yacht
              ? {
                  id: data.yacht.id || "",
                  name: data.yacht.name || "",
                  location: data.yacht.location || "",
                  date: data.yacht.date?.toDate() || new Date(),
                  startTime: data.yacht.startTime || "",
                  endTime: data.yacht.endTime || "",
                  hours: data.yacht.hours || 0,
                  pricePerHour: data.yacht.pricePerHour || 0,
                  price: data.yacht.price || 0,
                  status: data.yacht.status || "Pending",
                }
              : null,
            grandTotal: data.grandTotal || 0,
            notes: data.notes || [],
            activityLog: data.activityLog || [],
            deletedAt: data.deletedAt?.toDate() || null,
          };
        });
        setBookings(requests);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching bookings:", err);
        setError("Failed to load bookings. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const [showDeleted, setShowDeleted] = useState(false);

  // Separate active vs deleted
  const activeBookings = useMemo(() => bookings.filter((b) => !b.deletedAt), [bookings]);
  const deletedBookings = useMemo(() => bookings.filter((b) => !!b.deletedAt), [bookings]);

  // Soft delete / restore
  const softDeleteBooking = async (id: string) => {
    await updateDoc(doc(db, "bookingRequests", id), { deletedAt: Timestamp.now() });
  };
  const restoreBooking = async (id: string) => {
    await updateDoc(doc(db, "bookingRequests", id), { deletedAt: null });
  };
  const permanentDeleteBooking = async (id: string) => {
    if (!window.confirm("Permanently delete this booking? This cannot be undone.")) return;
    await deleteDoc(doc(db, "bookingRequests", id));
  };

  // CSV export
  const downloadCSV = () => {
    let csv = "Booking ID,Customer,Email,Phone,Items,Status,Total,Location,Date Range,Created\n";
    activeBookings.forEach((b) => {
      const items: string[] = [];
      if (b.villa) items.push("Villa: " + b.villa.name);
      if (b.car) items.push("Car: " + b.car.name);
      if (b.yacht) items.push("Yacht: " + b.yacht.name);
      const status = deriveBookingStatus(b);
      const location = getLocation(b);
      const dateRange = getDateRange(b);
      const row = [
        b.id,
        `"${b.customer.name.replace(/"/g, '""')}"`,
        b.customer.email,
        b.customer.phone || "",
        `"${items.join("; ")}"`,
        status,
        getActiveTotal(b),
        `"${location}"`,
        `"${dateRange}"`,
        format(b.createdAt, "yyyy-MM-dd HH:mm"),
      ];
      csv += row.join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredBookings = useMemo(() => {
    let result = activeBookings.filter((b) => {
      const status = deriveBookingStatus(b);
      if (statusFilter !== "All" && status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          b.customer.name.toLowerCase().includes(q) ||
          b.customer.email.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return [...result].sort((a, b) => {
      switch (sort) {
        case "newest": return b.createdAt.getTime() - a.createdAt.getTime();
        case "oldest": return a.createdAt.getTime() - b.createdAt.getTime();
        case "price-high": return getActiveTotal(b) - getActiveTotal(a);
        case "price-low": return getActiveTotal(a) - getActiveTotal(b);
        case "checkin-soon": return getEarliestDate(a).getTime() - getEarliestDate(b).getTime();
        default: return 0;
      }
    });
  }, [bookings, search, statusFilter, sort]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {
      total: activeBookings.length,
      Pending: 0, Approved: 0, Partial: 0, Completed: 0, Declined: 0,
    };
    activeBookings.forEach((b) => { counts[deriveBookingStatus(b)]++; });
    return counts;
  }, [activeBookings]);

  const getDateRange = (b: BookingRequest) => {
    const dates: Date[] = [];
    if (b.villa) { dates.push(b.villa.checkIn, b.villa.checkOut); }
    if (b.car) { dates.push(b.car.pickupDate, b.car.dropoffDate); }
    if (b.yacht) dates.push(b.yacht.date);
    if (dates.length === 0) return "—";
    const sorted = dates.sort((a, b) => a.getTime() - b.getTime());
    if (sorted.length === 1) return formatDate(sorted[0]);
    return `${formatDate(sorted[0])} – ${formatDate(sorted[sorted.length - 1])}`;
  };

  const getLocation = (b: BookingRequest) => b.villa?.location || b.car?.location || b.yacht?.location || "—";

  const statCards = [
    { label: "Total", value: stats.total, color: "text-foreground", filter: "All" as const },
    { label: "Pending", value: stats.Pending, color: "text-status-pending", filter: "Pending" as BookingStatus },
    { label: "Approved", value: stats.Approved, color: "text-status-approved", filter: "Approved" as BookingStatus },
    { label: "Partial", value: stats.Partial, color: "text-status-partial", filter: "Partial" as BookingStatus },
    { label: "Completed", value: stats.Completed, color: "text-status-completed", filter: "Completed" as BookingStatus },
    { label: "Declined", value: stats.Declined, color: "text-status-declined", filter: "Declined" as BookingStatus },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage and review booking requests
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s) => (
          <div
            key={s.label}
            onClick={() => setStatusFilter(s.filter)}
            className={cn(
              "cursor-pointer rounded-xl border bg-card px-4 py-3 transition-all duration-200 hover:shadow-md",
              statusFilter === s.filter
                ? "border-primary shadow-sm ring-1 ring-primary/20"
                : "border-border"
            )}
          >
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or booking ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-border bg-background pl-9"
          />
        </div>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
        <button
          onClick={() => setShowDeleted(!showDeleted)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
            showDeleted
              ? "border-red-500/30 bg-red-500/10 text-red-500"
              : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Deleted
          {deletedBookings.length > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-500">
              {deletedBookings.length}
            </span>
          )}
        </button>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-44 border-border bg-background text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="price-high">Highest price</SelectItem>
            <SelectItem value="price-low">Lowest price</SelectItem>
            <SelectItem value="checkin-soon">Check-in soonest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status filter pills */}
      <div className="mb-4 flex flex-wrap gap-1">
        {statusFilters.map((sf) => (
          <button
            key={sf}
            onClick={() => setStatusFilter(sf)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === sf
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {sf}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-center gap-3">
          <p className="text-destructive text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="ml-auto px-3 py-1 bg-destructive/20 text-destructive rounded-lg text-sm hover:bg-destructive/30"
          >
            Retry
          </button>
        </div>
      )}

      {/* Booking List */}
      <div className="space-y-2">
        {loading ? (
          <div className="rounded-xl border border-border bg-card py-12 text-center text-sm text-muted-foreground">
            Loading bookings...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-12 text-center text-sm text-muted-foreground">
            {activeBookings.length === 0 ? "No bookings yet" : "No bookings match your search"}
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const status = deriveBookingStatus(booking);
            const activeTotal = getActiveTotal(booking);

            return (
              <div
                key={booking.id}
                onClick={() => navigate(`/requests/${booking.id}`)}
                className="flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-all duration-200 hover:border-primary/20 hover:shadow-md"
              >
                {/* Customer */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {booking.customer.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {showPII
                      ? booking.customer.email
                      : maskEmail(booking.customer.email)}
                  </p>
                </div>

                {/* Item badges with status dots */}
                <div className="flex items-center gap-2">
                  {booking.villa && (
                    <div className="flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1">
                      <ItemIcon type="villa" className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Villa</span>
                      <StatusDot status={booking.villa.status} />
                    </div>
                  )}
                  {booking.car && (
                    <div className="flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1">
                      <ItemIcon type="car" className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Car</span>
                      <StatusDot status={booking.car.status} />
                    </div>
                  )}
                  {booking.yacht && (
                    <div className="flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1">
                      <ItemIcon type="yacht" className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Yacht</span>
                      <StatusDot status={booking.yacht.status} />
                    </div>
                  )}
                </div>

                {/* Date range */}
                <div className="hidden w-40 text-xs text-muted-foreground lg:block">
                  {getDateRange(booking)}
                </div>

                {/* Location */}
                <div className="hidden w-28 text-xs text-muted-foreground xl:block">
                  {getLocation(booking)}
                </div>

                {/* Price */}
                <div className="w-28 text-right">
                  <span className="text-sm font-semibold text-foreground">
                    {formatPrice(activeTotal)}
                  </span>
                  {activeTotal !== booking.grandTotal && (
                    <span className="ml-1 text-xs text-muted-foreground line-through">
                      {formatPrice(booking.grandTotal)}
                    </span>
                  )}
                </div>

                {/* Status */}
                <Badge
                  variant={getStatusVariant(status)}
                  className="w-24 justify-center"
                >
                  {status}
                </Badge>

                {/* Chevron */}
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            );
          })
        )}
      </div>

      {/* Recently Deleted */}
      {showDeleted && (
        <div className="mt-6 space-y-2">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-red-500" />
            Recently Deleted
            <span className="text-sm font-normal text-muted-foreground">({deletedBookings.length})</span>
          </h2>
          {deletedBookings.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-8 text-center text-sm text-muted-foreground">
              No deleted bookings
            </div>
          ) : (
            deletedBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground/60">{booking.customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {showPII ? booking.customer.email : maskEmail(booking.customer.email)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {booking.villa && (
                    <div className="flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1">
                      <ItemIcon type="villa" className="text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground/50">Villa</span>
                    </div>
                  )}
                  {booking.car && (
                    <div className="flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1">
                      <ItemIcon type="car" className="text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground/50">Car</span>
                    </div>
                  )}
                  {booking.yacht && (
                    <div className="flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1">
                      <ItemIcon type="yacht" className="text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground/50">Yacht</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {booking.deletedAt ? formatDistanceToNow(booking.deletedAt, { addSuffix: true }) : "—"}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => restoreBooking(booking.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-colors border border-green-500/20"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore
                  </button>
                  <button
                    onClick={() => permanentDeleteBooking(booking.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
