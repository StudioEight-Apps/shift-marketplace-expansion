import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { Search, ChevronRight, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import {
  LineItemStatus,
  TripStatus,
  deriveTripStatus,
  tripStatusColors,
} from "@/lib/bookingStatus";

interface BookingRequest {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
  paymentCollected?: boolean;
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
    status?: LineItemStatus;
  } | null;
  car: {
    name: string;
    price: number;
    pickupDate?: Date;
    dropoffDate?: Date;
    status?: LineItemStatus;
  } | null;
  yacht: {
    name: string;
    price: number;
    date?: Date;
    status?: LineItemStatus;
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
            status: data.status || "Pending",
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date(),
            paymentCollected: data.paymentCollected || false,
            customer: data.customer || { name: "Unknown", email: "", phone: "" },
            villa: data.villa
              ? {
                  ...data.villa,
                  checkIn: data.villa.checkIn?.toDate(),
                  checkOut: data.villa.checkOut?.toDate(),
                  status: data.villa.status || "Unverified",
                }
              : null,
            car: data.car
              ? {
                  ...data.car,
                  pickupDate: data.car.pickupDate?.toDate(),
                  dropoffDate: data.car.dropoffDate?.toDate(),
                  status: data.car.status || "Unverified",
                }
              : null,
            yacht: data.yacht
              ? {
                  ...data.yacht,
                  date: data.yacht.date?.toDate(),
                  status: data.yacht.status || "Unverified",
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
    const tripStatus = deriveTripStatus(booking);
    const matchesFilter = filter === "all" || tripStatus === filter;
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

  // Count line items
  const getLineItemCount = (booking: BookingRequest): number => {
    let count = 0;
    if (booking.villa) count++;
    if (booking.car) count++;
    if (booking.yacht) count++;
    return count;
  };

  // Count by trip status
  const statusCounts: Record<TripStatus, number> = {
    "In Review": 0,
    "Partially Booked": 0,
    "Fully Booked": 0,
    "Closed": 0,
  };

  bookings.forEach((b) => {
    const status = deriveTripStatus(b);
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
            <option value="In Review">In Review</option>
            <option value="Partially Booked">Partially Booked</option>
            <option value="Fully Booked">Fully Booked</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total</p>
            <p className="text-2xl font-bold text-white">{bookings.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-gray-400 text-sm">In Review</p>
            <p className="text-2xl font-bold text-amber-400">{statusCounts["In Review"]}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-gray-400 text-sm">Partially Booked</p>
            <p className="text-2xl font-bold text-blue-400">{statusCounts["Partially Booked"]}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-gray-400 text-sm">Fully Booked</p>
            <p className="text-2xl font-bold text-green-400">{statusCounts["Fully Booked"]}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-gray-400 text-sm">Closed</p>
            <p className="text-2xl font-bold text-gray-400">{statusCounts["Closed"]}</p>
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

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Booking ID</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">User</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">City</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Dates</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Items</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Last Updated</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Loading bookings...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    {bookings.length === 0 ? "No bookings yet" : "No bookings match your search"}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => {
                  const tripStatus = deriveTripStatus(booking);
                  return (
                    <tr
                      key={booking.id}
                      className="border-b border-border hover:bg-white/5 cursor-pointer transition-colors"
                      onClick={() => navigate(`/requests/${booking.id}`)}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-300">{booking.id.slice(0, 8)}...</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{booking.customer.name}</p>
                          <p className="text-gray-500 text-sm">{booking.customer.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{getBookingCity(booking)}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{getBookingDates(booking)}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-gray-500/20 text-gray-300 rounded-full text-sm">
                          {getLineItemCount(booking)} item{getLineItemCount(booking) !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tripStatusColors[tripStatus]}`}>
                          {tripStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {booking.updatedAt ? format(booking.updatedAt, "MMM d, h:mm a") : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1 text-gray-400 hover:text-white">
                          <span className="text-sm">View</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
