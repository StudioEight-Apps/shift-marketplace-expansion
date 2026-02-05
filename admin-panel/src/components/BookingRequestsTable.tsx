import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, Timestamp, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";

interface BookingRequest {
  id: string;
  status: "Pending" | "Approved" | "Partial" | "Declined";
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
  } | null;
  car: {
    name: string;
    pickupDate: Date;
    dropoffDate: Date;
    price: number;
    days: number;
  } | null;
  yacht: {
    name: string;
    date: Date;
    startTime: string;
    endTime: string;
    price: number;
    hours: number;
  } | null;
  grandTotal: number;
}

const BookingRequestsTable = () => {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | "Pending" | "Approved" | "Partial" | "Declined">("Pending");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;

    const unsubscribe = onSnapshot(
      collection(db, "bookingRequests"),
      (snapshot) => {
        const bookings: BookingRequest[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            status: data.status || "Pending",
            createdAt: data.createdAt?.toDate() || new Date(),
            customer: data.customer || {},
            villa: data.villa
              ? {
                  ...data.villa,
                  checkIn: data.villa.checkIn?.toDate(),
                  checkOut: data.villa.checkOut?.toDate(),
                }
              : null,
            car: data.car
              ? {
                  ...data.car,
                  pickupDate: data.car.pickupDate?.toDate(),
                  dropoffDate: data.car.dropoffDate?.toDate(),
                }
              : null,
            yacht: data.yacht
              ? {
                  ...data.yacht,
                  date: data.yacht.date?.toDate(),
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

  const filteredRequests =
    filter === "All" ? requests : requests.filter((r) => r.status === filter);

  const approveBooking = async (request: BookingRequest) => {
    if (!db) return;
    setProcessingId(request.id);

    try {
      // Update booking status
      await updateDoc(doc(db, "bookingRequests", request.id), {
        status: "Approved",
        reviewedAt: Timestamp.now(),
      });

      // Block dates on the asset(s)
      await blockDatesForAssets(request);

      alert("Booking approved and dates blocked!");
    } catch (error) {
      console.error("Error approving booking:", error);
      alert("Failed to approve booking");
    } finally {
      setProcessingId(null);
    }
  };

  const declineBooking = async (requestId: string) => {
    if (!db) return;
    setProcessingId(requestId);

    try {
      await updateDoc(doc(db, "bookingRequests", requestId), {
        status: "Declined",
        reviewedAt: Timestamp.now(),
      });
      alert("Booking declined");
    } catch (error) {
      console.error("Error declining booking:", error);
      alert("Failed to decline booking");
    } finally {
      setProcessingId(null);
    }
  };

  const partialApproveBooking = async (requestId: string) => {
    if (!db) return;
    setProcessingId(requestId);

    try {
      await updateDoc(doc(db, "bookingRequests", requestId), {
        status: "Partial",
        reviewedAt: Timestamp.now(),
      });
      alert("Booking marked as partial - some items may not be available");
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("Failed to update booking");
    } finally {
      setProcessingId(null);
    }
  };

  const blockDatesForAssets = async (request: BookingRequest) => {
    if (!db) return;

    // Block villa dates
    if (request.villa) {
      await blockDatesForAsset(
        "villas",
        request.villa.name,
        request.villa.checkIn,
        request.villa.checkOut
      );
    }

    // Block car dates
    if (request.car) {
      await blockDatesForAsset(
        "cars",
        request.car.name,
        request.car.pickupDate,
        request.car.dropoffDate
      );
    }

    // Block yacht dates
    if (request.yacht) {
      await blockDatesForAsset("yachts", request.yacht.name, request.yacht.date, request.yacht.date);
    }
  };

  const blockDatesForAsset = async (
    collectionName: string,
    assetName: string,
    startDate: Date,
    endDate: Date
  ) => {
    if (!db) return;

    // Find asset by name
    const assetsSnapshot = await getDocs(collection(db, collectionName));
    const assetDoc = assetsSnapshot.docs.find(
      (doc) => doc.data().name?.toLowerCase() === assetName.toLowerCase()
    );

    if (!assetDoc) {
      console.warn(`Asset ${assetName} not found in ${collectionName}`);
      return;
    }

    // Generate array of date strings to block
    const datesToBlock: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      datesToBlock.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get current blocked dates
    const currentBlockedDates = assetDoc.data().blockedDates || [];
    const updatedBlockedDates = [...new Set([...currentBlockedDates, ...datesToBlock])];

    // Update asset with new blocked dates
    await updateDoc(doc(db, collectionName, assetDoc.id), {
      blockedDates: updatedBlockedDates,
      updatedAt: Timestamp.now(),
    });
  };

  const getAssetInfo = (request: BookingRequest) => {
    if (request.villa) {
      return {
        type: "Villa",
        name: request.villa.name,
        dates: `${format(request.villa.checkIn, "MMM d")} - ${format(request.villa.checkOut, "MMM d, yyyy")}`,
        details: `${request.villa.nights} nights · ${request.villa.location}`,
      };
    }
    if (request.car) {
      return {
        type: "Car",
        name: request.car.name,
        dates: `${format(request.car.pickupDate, "MMM d")} - ${format(request.car.dropoffDate, "MMM d, yyyy")}`,
        details: `${request.car.days} days`,
      };
    }
    if (request.yacht) {
      return {
        type: "Yacht",
        name: request.yacht.name,
        dates: format(request.yacht.date, "MMM d, yyyy"),
        details: `${request.yacht.startTime} - ${request.yacht.endTime} (${request.yacht.hours}h)`,
      };
    }
    return { type: "Unknown", name: "", dates: "", details: "" };
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "Approved":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Partial":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "Declined":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading booking requests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Booking Requests</h1>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(["All", "Pending", "Approved", "Partial", "Declined"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              {status}
              <span className="ml-2 text-xs">
                ({status === "All" ? requests.length : requests.filter((r) => r.status === status).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No {filter.toLowerCase()} requests found
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/40 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRequests.map((request) => {
                  const assetInfo = getAssetInfo(request);
                  return (
                    <tr key={request.id} className="hover:bg-secondary/20">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          {request.customer.name}
                        </div>
                        <div className="text-xs text-muted-foreground">{request.customer.email}</div>
                        <div className="text-xs text-muted-foreground">{request.customer.phone}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-foreground">{assetInfo.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {assetInfo.type} · {assetInfo.details}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                        {assetInfo.dates}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        ${request.grandTotal.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {format(request.createdAt, "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {request.status === "Pending" && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => approveBooking(request)}
                              disabled={processingId === request.id}
                              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingId === request.id ? "..." : "Approve"}
                            </button>
                            <button
                              onClick={() => partialApproveBooking(request.id)}
                              disabled={processingId === request.id}
                              className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Partial
                            </button>
                            <button
                              onClick={() => declineBooking(request.id)}
                              disabled={processingId === request.id}
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                        {request.status !== "Pending" && (
                          <span className="text-muted-foreground text-xs">No actions</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingRequestsTable;
