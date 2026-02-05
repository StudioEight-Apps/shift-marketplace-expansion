import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { Search, ChevronRight, AlertCircle, Home, Car, Ship } from "lucide-react";
import Header from "@/components/Header";
import {
  ItemStatus,
  BookingStatus,
  deriveBookingStatus,
  bookingStatusColors,
} from "@/lib/bookingStatus";

interface BookingRequest {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
  customer: {
    uid?: string;
    name: string;
    email: string;
    phone: string;
  };
  villa: {
    name: string;
    price: number;
    checkIn?: Date;
    checkOut?: Date;
    location?: string;
    status?: ItemStatus;
  } | null;
  car: {
    name: string;
    price: number;
    pickupDate?: Date;
    dropoffDate?: Date;
    status?: ItemStatus;
  } | null;
  yacht: {
    name: string;
    price: number;
    date?: Date;
    status?: ItemStatus;
  } | null;
  grandTotal: number;
}

const Dashboard = () => {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

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
            customer: data.customer || { name: "Unknown", email: "", phone: "" },
            villa: data.villa
              ? {
                  ...data.villa,
                  checkIn: data.villa.checkIn?.toDate(),
                  checkOut: data.villa.checkOut?.toDate(),
                  status: data.villa.status || "Pending",
                }
              : null,
            car: data.car
              ? {
                  ...data.car,
                  pickupDate: data.car.pickupDate?.toDate(),
                  dropoffDate: data.car.dropoffDate?.toDate(),
                  status: data.car.status || "Pending",
                }
              : null,
            yacht: data.yacht
              ? {
                  ...data.yacht,
                  date: data.yacht.date?.toDate(),
                  status: data.yacht.status || "Pending",
                }
              : null,
            grandTotal: data.grandTotal || 0,
          };
        });
        requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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

  const filteredBookings = bookings.filter((booking) => {
    const bookingStatus = deriveBookingStatus(booking);
    const matchesFilter = filter === "all" || bookingStatus === filter;
    const matchesSearch =
      search === "" ||
      booking.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      booking.customer.email.toLowerCase().includes(search.toLowerCase()) ||
      booking.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Get city from booking (villa location or first available)
  const getBookingCity = (booking: BookingRequest): string => {
    if (booking.villa?.location) return booking.villa.location;
    return "-";
  };

  // Get date range from booking
  const getBookingDates = (booking: BookingRequest): string => {
    if (booking.villa?.checkIn && booking.villa?.checkOut) {
      return `${format(booking.villa.checkIn, "MMM d")} - ${format(booking.villa.checkOut, "MMM d")}`;
    }
    if (booking.car?.pickupDate && booking.car?.dropoffDate) {
      return `${format(booking.car.pickupDate, "MMM d")} - ${format(booking.car.dropoffDate, "MMM d")}`;
    }
    if (booking.yacht?.date) {
      return format(booking.yacht.date, "MMM d, yyyy");
    }
    return "-";
  };

  // Count by booking status
  const statusCounts: Record<BookingStatus, number> = {
    Pending: 0,
    Approved: 0,
    Partial: 0,
    Declined: 0,
  };

  bookings.forEach((b) => {
    const status = deriveBookingStatus(b);
    statusCounts[status]++;
  });

  return (
    <div className="flex flex-col h-full">
      <Header title="Bookings" />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 bg-card border border-border rounded-lg text-white focus:outline-none focus:border-primary"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Partial">Partial</option>
            <option value="Declined">Declined</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total</p>
            <p className="text-2xl font-bold text-white">{bookings.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-gray-400 text-sm">Pending</p>
            <p className="text-2xl font-bold text-amber-400">{statusCounts.Pending}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-gray-400 text-sm">Approved</p>
            <p className="text-2xl font-bold text-green-400">{statusCounts.Approved}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-gray-400 text-sm">Partial</p>
            <p className="text-2xl font-bold text-blue-400">{statusCounts.Partial}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-gray-400 text-sm">Declined</p>
            <p className="text-2xl font-bold text-red-400">{statusCounts.Declined}</p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="ml-auto px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        )}

        {/* Bookings List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading bookings...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {bookings.length === 0 ? "No bookings yet" : "No bookings match your search"}
            </div>
          ) : (
            filteredBookings.map((booking) => {
              const bookingStatus = deriveBookingStatus(booking);
              return (
                <div
                  key={booking.id}
                  className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 cursor-pointer transition-colors group"
                  onClick={() => navigate(`/bookings/${booking.id}`)}
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Customer & Items */}
                    <div className="flex items-center gap-6">
                      {/* Customer */}
                      <div className="min-w-[180px]">
                        <p className="text-white font-medium">{booking.customer.name}</p>
                        <p className="text-gray-500 text-sm">{booking.customer.email}</p>
                      </div>

                      {/* Items icons */}
                      <div className="flex items-center gap-2">
                        {booking.villa && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 rounded-lg">
                            <Home className="h-4 w-4 text-blue-400" />
                            <span className="text-blue-400 text-sm">Villa</span>
                          </div>
                        )}
                        {booking.car && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 rounded-lg">
                            <Car className="h-4 w-4 text-purple-400" />
                            <span className="text-purple-400 text-sm">Car</span>
                          </div>
                        )}
                        {booking.yacht && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-500/10 rounded-lg">
                            <Ship className="h-4 w-4 text-cyan-400" />
                            <span className="text-cyan-400 text-sm">Yacht</span>
                          </div>
                        )}
                      </div>

                      {/* Dates & City */}
                      <div className="text-gray-400 text-sm">
                        {getBookingDates(booking)} · {getBookingCity(booking)}
                      </div>
                    </div>

                    {/* Right: Price, Status, Arrow */}
                    <div className="flex items-center gap-6">
                      {/* Price */}
                      <div className="text-right min-w-[100px]">
                        <p className="text-white font-semibold">${booking.grandTotal.toLocaleString()}</p>
                      </div>

                      {/* Status */}
                      <div className={`px-3 py-1 rounded-lg text-sm font-medium min-w-[90px] text-center ${bookingStatusColors[bookingStatus]}`}>
                        {bookingStatus}
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
