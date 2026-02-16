import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Home, Car, Ship, ChevronRight } from "lucide-react";
import { ItemStatus, deriveBookingStatus, bookingStatusColors, BookingStatus } from "@/lib/bookingStatus";

interface BookingRequest {
  id: string;
  createdAt: Date;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  villa: {
    name: string;
    checkIn: Date;
    checkOut: Date;
    price: number;
    nights: number;
    location: string;
    status?: ItemStatus;
  } | null;
  car: {
    name: string;
    location?: string;
    pickupDate: Date;
    dropoffDate: Date;
    price: number;
    days: number;
    status?: ItemStatus;
  } | null;
  yacht: {
    name: string;
    location?: string;
    date: Date;
    startTime: string;
    endTime: string;
    price: number;
    hours: number;
    status?: ItemStatus;
  } | null;
  grandTotal: number;
}

const BookingRequestsTable = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | BookingStatus>("All");

  useEffect(() => {
    if (!db) return;

    const unsubscribe = onSnapshot(
      collection(db, "bookingRequests"),
      (snapshot) => {
        const bookings: BookingRequest[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            customer: data.customer || {},
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

        // Sort by createdAt desc
        bookings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setRequests(bookings);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching booking requests:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Get derived status for each booking
  const getBookingStatus = (booking: BookingRequest): BookingStatus => {
    return deriveBookingStatus(booking);
  };

  // Filter by derived status
  const filteredRequests = filter === "All"
    ? requests
    : requests.filter((r) => getBookingStatus(r) === filter);

  // Count bookings by status
  const statusCounts = {
    All: requests.length,
    Pending: requests.filter((r) => getBookingStatus(r) === "Pending").length,
    Approved: requests.filter((r) => getBookingStatus(r) === "Approved").length,
    Partial: requests.filter((r) => getBookingStatus(r) === "Partial").length,
    Declined: requests.filter((r) => getBookingStatus(r) === "Declined").length,
  };

  // Get location from any item in the booking
  const getLocation = (booking: BookingRequest): string => {
    return booking.villa?.location || booking.car?.location || booking.yacht?.location || "";
  };

  // Get date range display
  const getDateRange = (booking: BookingRequest): string => {
    if (booking.villa) {
      return `${format(booking.villa.checkIn, "MMM d")} - ${format(booking.villa.checkOut, "MMM d")}`;
    }
    if (booking.car) {
      return `${format(booking.car.pickupDate, "MMM d")} - ${format(booking.car.dropoffDate, "MMM d")}`;
    }
    if (booking.yacht) {
      return format(booking.yacht.date, "MMM d, yyyy");
    }
    return "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Bookings</h1>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(["All", "Pending", "Approved", "Partial", "Declined"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? "bg-primary text-black"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {status}
              <span className="ml-2 text-xs opacity-70">({statusCounts[status]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No {filter.toLowerCase()} bookings found
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((booking) => {
            const status = getBookingStatus(booking);
            return (
              <div
                key={booking.id}
                onClick={() => navigate(`/bookings/${booking.id}`)}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 cursor-pointer transition-colors group"
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

                    {/* Dates */}
                    <div className="text-gray-400 text-sm">
                      {getDateRange(booking)}
                    </div>

                    {/* Location */}
                    <div className="text-gray-400 text-sm min-w-[120px]">
                      {getLocation(booking) || "—"}
                    </div>
                  </div>

                  {/* Right: Price, Status, Arrow */}
                  <div className="flex items-center gap-6">
                    {/* Price */}
                    <div className="text-right min-w-[100px]">
                      <p className="text-white font-semibold">${booking.grandTotal.toLocaleString()}</p>
                    </div>

                    {/* Status */}
                    <div className={`px-3 py-1 rounded-lg text-sm font-medium ${bookingStatusColors[status]}`}>
                      {status}
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingRequestsTable;
