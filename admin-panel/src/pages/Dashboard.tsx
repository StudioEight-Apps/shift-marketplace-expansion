import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query } from "firebase/firestore";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Home, Car, Ship, Search, ChevronRight } from "lucide-react";
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

  const filteredBookings = useMemo(() => {
    let result = bookings.filter((b) => {
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
      total: bookings.length,
      Pending: 0, Approved: 0, Partial: 0, Completed: 0, Declined: 0,
    };
    bookings.forEach((b) => { counts[deriveBookingStatus(b)]++; });
    return counts;
  }, [bookings]);

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
            {bookings.length === 0 ? "No bookings yet" : "No bookings match your search"}
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
    </div>
  );
};

export default Dashboard;
