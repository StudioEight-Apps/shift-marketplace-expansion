import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Home,
  Car,
  Ship,
  Calendar,
  Download,
  Loader2,
  Link2,
} from "lucide-react";
import Header from "@/components/Header";
import {
  getVillas,
  getCars,
  getYachts,
  updateVilla,
  updateCar,
  updateYacht,
  deleteVilla,
  deleteCar,
  deleteYacht,
} from "@/lib/listings";
import type { Villa, Car as CarType, Yacht } from "@/lib/listings";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import AddVillaModal from "@/components/AddVillaModal";
import AddCarModal from "@/components/AddCarModal";
import AddYachtModal from "@/components/AddYachtModal";
import { useAuth } from "@/context/AuthContext";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/booking-utils";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const PUBLIC_BASE_URL = "https://adoring-ptolemy.vercel.app";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TabType = "villas" | "cars" | "yachts";
type SourceFilter = "all" | "shift_fleet" | "external";
type AnyListing = Villa | CarType | Yacht;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalised source key used for filtering / badge display. */
function getSourceKey(listing: AnyListing, tab: TabType): "shift_fleet" | "pms" | "api" {
  if (tab === "villas") return (listing as Villa).sourceType;
  const src = (listing as CarType | Yacht).source;
  return src === "manual" ? "shift_fleet" : "api";
}

function getSourceLabel(listing: AnyListing, tab: TabType): string {
  if (tab === "villas") {
    const v = listing as Villa;
    if (v.sourceType === "shift_fleet") return "Shift Fleet";
    if (v.sourceType === "pms") return `PMS: ${v.sourceName}`;
    return v.sourceName || "API";
  }
  const item = listing as CarType | Yacht;
  return item.source === "manual" ? "Shift Fleet" : item.provider || "API";
}

function getSourceBadgeVariant(listing: AnyListing, tab: TabType): "shift" | "pms" | "api" {
  const key = getSourceKey(listing, tab);
  if (key === "shift_fleet") return "shift";
  if (key === "pms") return "pms";
  return "api";
}

function isShiftFleet(listing: AnyListing, tab: TabType): boolean {
  return getSourceKey(listing, tab) === "shift_fleet";
}

function getPrice(listing: AnyListing, tab: TabType): string {
  if (tab === "villas") return `${formatPrice((listing as Villa).pricePerNight)}/night`;
  if (tab === "cars") return `${formatPrice((listing as CarType).pricePerDay)}/day`;
  return `${formatPrice((listing as Yacht).pricePerHour)}/hour`;
}

function getSubtitle(listing: AnyListing, tab: TabType): string {
  if (tab === "villas") {
    const v = listing as Villa;
    return `${v.bedrooms} beds \u00B7 ${v.maxGuests} guests`;
  }
  if (tab === "cars") {
    const c = listing as CarType;
    return `${c.bodyStyle} \u00B7 ${c.seats} seats`;
  }
  const y = listing as Yacht;
  return `${y.length}ft \u00B7 ${y.maxGuests} guests`;
}

function getLocation(listing: AnyListing): string {
  return listing.location ?? "";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const Inventory = () => {
  const { role } = useAuth();

  // Data
  const [villas, setVillas] = useState<Villa[]>([]);
  const [cars, setCars] = useState<CarType[]>([]);
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>("villas");
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  // Modal state
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<AnyListing | null>(null);

  // Per-type add/edit modal state
  const [showAddVilla, setShowAddVilla] = useState(false);
  const [showAddCar, setShowAddCar] = useState(false);
  const [showAddYacht, setShowAddYacht] = useState(false);
  const [editingVilla, setEditingVilla] = useState<Villa | null>(null);
  const [editingCar, setEditingCar] = useState<CarType | null>(null);
  const [editingYacht, setEditingYacht] = useState<Yacht | null>(null);

  // ---- Firebase subscriptions ----
  useEffect(() => {
    let loaded = 0;
    const markLoaded = () => {
      loaded++;
      if (loaded >= 3) setLoading(false);
    };
    const unsubVillas = getVillas((data) => {
      setVillas(data);
      markLoaded();
    });
    const unsubCars = getCars((data) => {
      setCars(data);
      markLoaded();
    });
    const unsubYachts = getYachts((data) => {
      setYachts(data);
      markLoaded();
    });
    return () => {
      unsubVillas();
      unsubCars();
      unsubYachts();
    };
  }, []);

  // ---- Derived data ----
  const currentList: AnyListing[] = useMemo(() => {
    let items: AnyListing[] =
      activeTab === "villas" ? villas : activeTab === "cars" ? cars : yachts;

    // Source filter
    if (sourceFilter !== "all") {
      items = items.filter((item) => {
        const key = getSourceKey(item, activeTab);
        if (sourceFilter === "shift_fleet") return key === "shift_fleet";
        // "external" means anything that is not shift_fleet
        return key !== "shift_fleet";
      });
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          getLocation(item).toLowerCase().includes(q),
      );
    }

    return items;
  }, [activeTab, villas, cars, yachts, sourceFilter, searchQuery]);

  // ---- Permissions ----
  const canAddEdit = role ? hasPermission(role, "add_edit_listings") : false;
  const canDelete = role ? hasPermission(role, "delete_listings") : false;
  const canToggle = role ? hasPermission(role, "toggle_status_featured") : false;
  const canCalendar = role ? hasPermission(role, "block_calendar") : false;

  // ---- Handlers ----
  const toggleStatus = async (listing: AnyListing) => {
    if (!canToggle) return;
    const newStatus = listing.status === "active" ? "hidden" : "active";
    try {
      if (activeTab === "villas") await updateVilla(listing.id, { status: newStatus });
      else if (activeTab === "cars") await updateCar(listing.id, { status: newStatus });
      else await updateYacht(listing.id, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const toggleFeatured = async (listing: AnyListing) => {
    if (!canToggle) return;
    try {
      if (activeTab === "villas") await updateVilla(listing.id, { featured: !listing.featured });
      else if (activeTab === "cars") await updateCar(listing.id, { featured: !listing.featured });
      else await updateYacht(listing.id, { featured: !listing.featured });
      toast.success(listing.featured ? "Removed from featured" : "Marked as featured");
    } catch {
      toast.error("Failed to update featured status");
    }
  };

  const confirmDelete = async () => {
    if (!selectedListing) return;
    try {
      if (activeTab === "villas") await deleteVilla(selectedListing.id);
      else if (activeTab === "cars") await deleteCar(selectedListing.id);
      else await deleteYacht(selectedListing.id);
      toast.success("Listing deleted");
    } catch {
      toast.error("Failed to delete listing");
    } finally {
      setDeleteOpen(false);
      setSelectedListing(null);
    }
  };

  // Block / unblock dates (used by AvailabilityCalendar)
  const handleBlockDates = async (dates: string[]) => {
    if (!selectedListing) return;
    try {
      const current = (selectedListing as any).blockedDates || [];
      const merged = [...new Set([...current, ...dates])];
      if (activeTab === "villas") await updateVilla(selectedListing.id, { blockedDates: merged });
      else if (activeTab === "cars") await updateCar(selectedListing.id, { blockedDates: merged });
      else await updateYacht(selectedListing.id, { blockedDates: merged });
      toast.success(`${dates.length} date${dates.length > 1 ? "s" : ""} blocked`);
    } catch (err) {
      console.error("Failed to block dates:", err);
      toast.error("Failed to block dates. Please try again.");
    }
  };

  const handleUnblockDates = async (dates: string[]) => {
    if (!selectedListing) return;
    try {
      const current = (selectedListing as any).blockedDates || [];
      const filtered = current.filter((d: string) => !dates.includes(d));
      if (activeTab === "villas") await updateVilla(selectedListing.id, { blockedDates: filtered });
      else if (activeTab === "cars") await updateCar(selectedListing.id, { blockedDates: filtered });
      else await updateYacht(selectedListing.id, { blockedDates: filtered });
      toast.success(`${dates.length} date${dates.length > 1 ? "s" : ""} unblocked`);
    } catch (err) {
      console.error("Failed to unblock dates:", err);
      toast.error("Failed to unblock dates. Please try again.");
    }
  };

  // ---- Add / Edit handlers ----
  const handleAdd = () => {
    if (activeTab === "villas") setShowAddVilla(true);
    else if (activeTab === "cars") setShowAddCar(true);
    else setShowAddYacht(true);
  };

  const handleEdit = (listing: AnyListing) => {
    if (activeTab === "villas") setEditingVilla(listing as Villa);
    else if (activeTab === "cars") setEditingCar(listing as CarType);
    else setEditingYacht(listing as Yacht);
  };

  // ---- Tab config ----
  const tabs = [
    { id: "villas" as TabType, label: "Villas", icon: Home, count: villas.length },
    { id: "cars" as TabType, label: "Cars", icon: Car, count: cars.length },
    { id: "yachts" as TabType, label: "Yachts", icon: Ship, count: yachts.length },
  ];

  const sourceFilters: { id: SourceFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "shift_fleet", label: "Shift Fleet" },
    { id: "external", label: "External" },
  ];

  const singularLabel = activeTab === "villas" ? "Villa" : activeTab === "cars" ? "Car" : "Yacht";

  // =====================================================================
  // Render
  // =====================================================================
  return (
    <div className="flex flex-col h-full">
      <Header title="Inventory" />

      <div className="p-6 space-y-6 overflow-auto">
        {/* ---- Tabs ---- */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery("");
                  setSourceFilter("all");
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs",
                    activeTab === tab.id ? "bg-black/20" : "bg-muted",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {activeTab === "villas" && canAddEdit && (
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                <Download className="h-4 w-4 mr-1" />
                Import from Catalog
              </Button>
            )}
            {canAddEdit && (
              <Button
                size="sm"
                onClick={handleAdd}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add {singularLabel}
              </Button>
            )}
          </div>
        </div>

        {/* ---- Search + source filter ---- */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>

          <div className="flex gap-1">
            {sourceFilters.map((sf) => (
              <button
                key={sf.id}
                onClick={() => setSourceFilter(sf.id)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  sourceFilter === sf.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {sf.label}
              </button>
            ))}
          </div>
        </div>

        {/* ---- Table ---- */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Name</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Location</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Price</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Source</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Active</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Featured</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : currentList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    {searchQuery || sourceFilter !== "all"
                      ? "No results match your filters."
                      : `No ${activeTab} found. Click "Add ${singularLabel}" to create your first listing.`}
                  </td>
                </tr>
              ) : (
                currentList.map((listing) => {
                  const shiftFleet = isShiftFleet(listing, activeTab);

                  return (
                    <tr key={listing.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-9 bg-muted rounded-md overflow-hidden flex-shrink-0">
                            {listing.images?.[0] && (
                              <img
                                src={listing.images[0]}
                                alt={listing.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <p className="text-foreground font-medium text-sm">{listing.name}</p>
                            <p className="text-muted-foreground text-xs">{getSubtitle(listing, activeTab)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4 text-muted-foreground text-sm">{getLocation(listing)}</td>

                      {/* Price */}
                      <td className="px-6 py-4 text-foreground text-sm font-medium">{getPrice(listing, activeTab)}</td>

                      {/* Source */}
                      <td className="px-6 py-4">
                        <Badge variant={getSourceBadgeVariant(listing, activeTab)}>
                          {getSourceLabel(listing, activeTab)}
                        </Badge>
                      </td>

                      {/* Active toggle */}
                      <td className="px-6 py-4">
                        <Switch
                          checked={listing.status === "active"}
                          onCheckedChange={() => toggleStatus(listing)}
                          disabled={!canToggle}
                          aria-label="Toggle active"
                        />
                      </td>

                      {/* Featured toggle */}
                      <td className="px-6 py-4">
                        <Switch
                          checked={listing.featured}
                          onCheckedChange={() => toggleFeatured(listing)}
                          disabled={!canToggle}
                          aria-label="Toggle featured"
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          {/* Copy Link */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Copy public link"
                            onClick={() => {
                              const url = `${PUBLIC_BASE_URL}/listing/${listing.id}`;
                              navigator.clipboard.writeText(url).then(() => {
                                toast.success("Link copied to clipboard");
                              }).catch(() => {
                                toast.error("Failed to copy link");
                              });
                            }}
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>

                          {/* Calendar */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:text-primary"
                            title="Availability Calendar"
                            disabled={!canCalendar}
                            onClick={() => {
                              setSelectedListing(listing);
                              setCalendarOpen(true);
                            }}
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>

                          {/* Edit */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Edit"
                            disabled={!canAddEdit || !shiftFleet}
                            onClick={() => handleEdit(listing)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            title="Delete"
                            disabled={!canDelete || !shiftFleet}
                            onClick={() => {
                              setSelectedListing(listing);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================================
          MODALS
         ================================================================= */}

      {/* ---- Add / Edit Modals ---- */}
      {(showAddVilla || editingVilla) && (
        <AddVillaModal
          villa={editingVilla}
          onClose={() => {
            setShowAddVilla(false);
            setEditingVilla(null);
          }}
        />
      )}
      {(showAddCar || editingCar) && (
        <AddCarModal
          car={editingCar}
          onClose={() => {
            setShowAddCar(false);
            setEditingCar(null);
          }}
        />
      )}
      {(showAddYacht || editingYacht) && (
        <AddYachtModal
          yacht={editingYacht}
          onClose={() => {
            setShowAddYacht(false);
            setEditingYacht(null);
          }}
        />
      )}

      {/* ---- Delete Confirmation ---- */}
      <AlertDialog open={deleteOpen} onOpenChange={(open) => { if (!open) { setDeleteOpen(false); setSelectedListing(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {singularLabel}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{selectedListing?.name}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteOpen(false); setSelectedListing(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---- Availability Calendar ---- */}
      {calendarOpen && selectedListing && (
        <AvailabilityCalendar
          itemName={selectedListing.name}
          itemType={activeTab === "villas" ? "villa" : activeTab === "cars" ? "car" : "yacht"}
          blockedDates={(selectedListing as any).blockedDates || []}
          readOnlyCalendar={
            activeTab === "villas"
              ? (selectedListing as Villa).readOnlyCalendar
              : (selectedListing as CarType | Yacht).source === "api"
          }
          syncStatus={activeTab === "villas" ? (selectedListing as Villa).syncStatus : undefined}
          lastSyncedAt={activeTab === "villas" ? (selectedListing as Villa).lastSyncedAt : undefined}
          onBlockDates={handleBlockDates}
          onUnblockDates={handleUnblockDates}
          onClose={() => {
            setCalendarOpen(false);
            setSelectedListing(null);
          }}
        />
      )}

      {/* ---- Import Catalog Sheet (placeholder) ---- */}
      <Sheet open={importOpen} onOpenChange={setImportOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Import from Catalog</SheetTitle>
            <SheetDescription>
              Browse and import villas from external property catalogs. This feature is coming soon.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Download className="h-10 w-10 mb-4 opacity-40" />
            <p className="text-sm">Catalog import is not yet available.</p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Inventory;
