import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, doc, deleteDoc, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { hasPermission, maskEmail, maskPhone } from "@/lib/permissions";
import { formatDate, formatPrice } from "@/lib/booking-utils";
import { Search, MoreHorizontal, ChevronRight, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SortOption = "a-z" | "z-a" | "newest" | "oldest" | "highest-ltv" | "lowest-ltv" | "most-trips";

interface FirestoreUser {
  uid: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  totalTrips: number;
  lastTripDate: Date | null;
  lifetimeValue: number;
  createdAt: Date;
  notes: { text: string; author: string; timestamp: Date }[];
  bookings: string[];
}

const Users = () => {
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [deleteUser, setDeleteUser] = useState<FirestoreUser | null>(null);
  const [deleteChecking, setDeleteChecking] = useState(false);
  const [deleteBookingWarnings, setDeleteBookingWarnings] = useState<string[]>([]);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();
  const { role } = useAuth();

  // Real-time listener on users collection
  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userList: FirestoreUser[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          // Support both "name" field and "firstName/lastName" fields
          const name =
            data.name ||
            `${data.firstName || ""} ${data.lastName || ""}`.trim() ||
            "Unknown";
          return {
            uid: docSnap.id,
            name,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
            phone: data.phone || "",
            totalTrips: data.totalTrips || 0,
            lastTripDate: data.lastTripDate?.toDate() || null,
            lifetimeValue: data.lifetimeValue || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
            notes:
              data.notes?.map(
                (n: { text: string; author: string; timestamp: { toDate: () => Date } }) => ({
                  ...n,
                  timestamp: n.timestamp?.toDate() || new Date(),
                })
              ) || [],
            bookings: data.bookings || [],
          };
        });
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

  // Filter by search term and sort
  const filteredAndSortedUsers = useMemo(() => {
    let result = users.filter((u) => {
      const searchLower = search.toLowerCase();
      return (
        search === "" ||
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
      );
    });

    // Sort
    switch (sort) {
      case "a-z":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "z-a":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "newest":
        result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case "oldest":
        result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case "highest-ltv":
        result.sort((a, b) => b.lifetimeValue - a.lifetimeValue);
        break;
      case "lowest-ltv":
        result.sort((a, b) => a.lifetimeValue - b.lifetimeValue);
        break;
      case "most-trips":
        result.sort((a, b) => b.totalTrips - a.totalTrips);
        break;
    }

    return result;
  }, [users, search, sort]);

  // Check for active bookings before allowing delete
  const handleDeleteClick = async (user: FirestoreUser) => {
    setDeleteUser(user);
    setDeleteChecking(true);
    setDeleteBookingWarnings([]);
    setDeleteConfirmed(false);

    try {
      const bookingsQuery = query(
        collection(db, "bookingRequests"),
        where("customer.uid", "==", user.uid)
      );
      const snapshot = await getDocs(bookingsQuery);
      const warnings: string[] = [];
      const now = new Date();

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const status = (data.status || "pending").toLowerCase();
        const id = docSnap.id.slice(0, 8);

        // Check for active/future bookings
        const checkOutDates: Date[] = [];
        if (data.villa?.checkOut) checkOutDates.push(data.villa.checkOut.toDate());
        if (data.car?.dropoffDate) checkOutDates.push(data.car.dropoffDate.toDate());
        if (data.yacht?.date) checkOutDates.push(data.yacht.date.toDate());

        const latestDate = checkOutDates.length > 0
          ? new Date(Math.max(...checkOutDates.map((d) => d.getTime())))
          : null;

        const isFuture = latestDate && latestDate > now;
        const isActive = ["pending", "approved", "confirmed", "partial"].includes(status);

        if (isFuture && isActive) {
          warnings.push(`Booking #${id} — ${status} (ends ${latestDate!.toLocaleDateString()})`);
        }
      });

      setDeleteBookingWarnings(warnings);
    } catch (err) {
      console.error("Error checking bookings:", err);
      toast.error("Failed to check user's bookings");
    }
    setDeleteChecking(false);
  };

  // Actually delete the user
  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "users", deleteUser.uid));
      toast.success(`${deleteUser.name} has been deleted`);
      setDeleteUser(null);
      setDeleteConfirmed(false);
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error("Failed to delete user");
    }
    setDeleting(false);
  };

  const canViewPii = role ? hasPermission(role, "view_pii") : false;
  const canViewUserDetail = role ? hasPermission(role, "view_user_detail") : false;

  return (
    <div className="flex flex-col h-full">
      <Header title="Users" />

      <div className="p-6 space-y-6 overflow-auto">
        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a-z">Name A-Z</SelectItem>
              <SelectItem value="z-a">Name Z-A</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest-ltv">Highest LTV</SelectItem>
              <SelectItem value="lowest-ltv">Lowest LTV</SelectItem>
              <SelectItem value="most-trips">Most Trips</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center gap-3">
            <p className="text-destructive text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Users Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Trips</TableHead>
                <TableHead>Last Trip</TableHead>
                <TableHead>Lifetime Value</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredAndSortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    {users.length === 0 ? "No users yet" : "No users match your search"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedUsers.map((user) => (
                  <TableRow
                    key={user.uid}
                    className="cursor-pointer"
                    onClick={() => {
                      if (canViewUserDetail) {
                        navigate(`/users/${user.uid}`);
                      }
                    }}
                  >
                    <TableCell className="font-medium text-foreground">
                      {user.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {canViewPii ? user.email : maskEmail(user.email)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.phone
                        ? canViewPii
                          ? user.phone
                          : maskPhone(user.phone)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium">
                        {user.totalTrips}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.lastTripDate ? formatDate(user.lastTripDate) : "-"}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {user.lifetimeValue ? formatPrice(user.lifetimeValue) : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canViewUserDetail && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/users/${user.uid}`);
                              }}
                            >
                              <ChevronRight className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          )}
                          {role && hasPermission(role, "edit_lifetime_value") && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(user);
                              }}
                              className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog
        open={!!deleteUser}
        onOpenChange={() => {
          setDeleteUser(null);
          setDeleteConfirmed(false);
          setDeleteBookingWarnings([]);
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  Are you sure you want to permanently delete <strong className="text-foreground">{deleteUser?.name}</strong>?
                  This removes their profile from the admin panel.
                </p>

                {deleteChecking && (
                  <p className="text-muted-foreground">Checking for active bookings...</p>
                )}

                {deleteBookingWarnings.length > 0 && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-amber-500 font-medium text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      Active / Future Bookings Found
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {deleteBookingWarnings.map((w, i) => (
                        <li key={i} className="ml-6 list-disc">{w}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground">
                      Deleting this user will NOT cancel their bookings. Existing booking records will be preserved.
                    </p>
                  </div>
                )}

                {!deleteChecking && deleteBookingWarnings.length === 0 && deleteUser && (
                  <p className="text-sm text-muted-foreground">
                    No active or future bookings found. Existing past booking records will be preserved.
                  </p>
                )}

                {!deleteChecking && (
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={deleteConfirmed}
                      onChange={(e) => setDeleteConfirmed(e.target.checked)}
                      className="rounded border-border accent-red-500"
                    />
                    <span className="text-sm text-foreground">
                      I understand this action cannot be undone
                    </span>
                  </label>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              onClick={() => {
                setDeleteConfirmed(false);
                setDeleteBookingWarnings([]);
              }}
              className="border-border text-foreground hover:bg-muted"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={handleDeleteUser}
              disabled={deleting || deleteChecking || !deleteConfirmed}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete User"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;
