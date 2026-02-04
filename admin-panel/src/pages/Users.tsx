import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { Search, ChevronRight, AlertCircle } from "lucide-react";
import Header from "@/components/Header";

interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  createdAt: Date;
  lifetimeValue?: number;
}

interface BookingData {
  id: string;
  customerUid: string;
  createdAt: Date;
  grandTotal: number;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Fetch users from users collection
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const userList: User[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            uid: doc.id,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
            phone: data.phone || "",
            role: data.role || "customer",
            createdAt: data.createdAt?.toDate() || new Date(),
            lifetimeValue: data.lifetimeValue || 0,
          };
        });
        userList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setUsers(userList);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching users:", err);
        setError("Failed to load users. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch all bookings to calculate per-user stats
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "bookingRequests"), (snapshot) => {
      const bookingList: BookingData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          customerUid: data.customer?.uid || "",
          createdAt: data.createdAt?.toDate() || new Date(),
          grandTotal: data.grandTotal || 0,
        };
      });
      setBookings(bookingList);
    });

    return () => unsubscribe();
  }, []);

  // Calculate user stats from bookings
  const getUserStats = (uid: string) => {
    const userBookings = bookings.filter((b) => b.customerUid === uid);
    const totalTrips = userBookings.length;
    const lastTrip = userBookings.length > 0
      ? userBookings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
      : null;
    return { totalTrips, lastTrip };
  };

  const filteredUsers = users
    .filter((user) => user.role !== "admin") // Hide admin users from the list
    .filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return (
        search === "" ||
        fullName.includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    });

  return (
    <div className="flex flex-col h-full">
      <Header title="Users" />

      <div className="p-6 space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
          />
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
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Name</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Email</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Phone</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Total Trips</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Last Trip</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Lifetime Value</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Created</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    {users.length === 0 ? "No users yet" : "No users match your search"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const { totalTrips, lastTrip } = getUserStats(user.uid);
                  return (
                    <tr
                      key={user.uid}
                      className="border-b border-border hover:bg-white/5 cursor-pointer transition-colors"
                      onClick={() => navigate(`/users/${user.uid}`)}
                    >
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{user.email}</td>
                      <td className="px-6 py-4 text-gray-400">{user.phone || "-"}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                          {totalTrips}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {lastTrip ? format(lastTrip, "MMM d, yyyy") : "-"}
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        {user.lifetimeValue ? `$${user.lifetimeValue.toLocaleString()}` : "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {format(user.createdAt, "MMM d, yyyy")}
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

export default Users;
