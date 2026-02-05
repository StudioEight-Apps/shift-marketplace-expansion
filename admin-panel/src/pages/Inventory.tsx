import { useEffect, useState } from "react";
import { Plus, Eye, EyeOff, Star, Pencil, Trash2, Home, Car, Ship, Calendar } from "lucide-react";
import Header from "@/components/Header";
import {
  Villa,
  Car as CarType,
  Yacht,
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
import AddVillaModal from "@/components/AddVillaModal";
import AddCarModal from "@/components/AddCarModal";
import AddYachtModal from "@/components/AddYachtModal";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";

type TabType = "villas" | "cars" | "yachts";
type FilterType = "all" | "shift";

const Inventory = () => {
  const [activeTab, setActiveTab] = useState<TabType>("villas");
  const [filter, setFilter] = useState<FilterType>("all");
  const [villas, setVillas] = useState<Villa[]>([]);
  const [cars, setCars] = useState<CarType[]>([]);
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddVilla, setShowAddVilla] = useState(false);
  const [showAddCar, setShowAddCar] = useState(false);
  const [showAddYacht, setShowAddYacht] = useState(false);
  const [editingVilla, setEditingVilla] = useState<Villa | null>(null);
  const [editingCar, setEditingCar] = useState<CarType | null>(null);
  const [editingYacht, setEditingYacht] = useState<Yacht | null>(null);
  const [calendarVilla, setCalendarVilla] = useState<Villa | null>(null);
  const [calendarCar, setCalendarCar] = useState<CarType | null>(null);
  const [calendarYacht, setCalendarYacht] = useState<Yacht | null>(null);

  // Fetch all listings
  useEffect(() => {
    const unsubVillas = getVillas((data) => {
      setVillas(data);
      setLoading(false);
    });
    const unsubCars = getCars((data) => setCars(data));
    const unsubYachts = getYachts((data) => setYachts(data));

    return () => {
      unsubVillas();
      unsubCars();
      unsubYachts();
    };
  }, []);

  // Filter listings by source
  const filterBySource = <T extends { sourceType: string }>(items: T[]) => {
    if (filter === "all") return items;
    if (filter === "shift") return items.filter((i) => i.sourceType === "shift_fleet");
    return items;
  };

  const filteredVillas = filterBySource(villas);
  const filteredCars = filterBySource(cars);
  const filteredYachts = filterBySource(yachts);

  // Toggle status
  const toggleStatus = async (type: TabType, id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "hidden" : "active";
    if (type === "villas") await updateVilla(id, { status: newStatus });
    if (type === "cars") await updateCar(id, { status: newStatus });
    if (type === "yachts") await updateYacht(id, { status: newStatus });
  };

  // Toggle featured
  const toggleFeatured = async (type: TabType, id: string, currentFeatured: boolean) => {
    if (type === "villas") await updateVilla(id, { featured: !currentFeatured });
    if (type === "cars") await updateCar(id, { featured: !currentFeatured });
    if (type === "yachts") await updateYacht(id, { featured: !currentFeatured });
  };

  // Delete listing
  const handleDelete = async (type: TabType, id: string, sourceType: string) => {
    if (sourceType !== "shift_fleet") {
      alert("Cannot delete PMS or API listings");
      return;
    }
    if (!confirm("Are you sure you want to delete this listing?")) return;

    if (type === "villas") await deleteVilla(id);
    if (type === "cars") await deleteCar(id);
    if (type === "yachts") await deleteYacht(id);
  };

  // Get add button handler
  const handleAdd = () => {
    if (activeTab === "villas") setShowAddVilla(true);
    if (activeTab === "cars") setShowAddCar(true);
    if (activeTab === "yachts") setShowAddYacht(true);
  };

  // Block dates handler
  const handleBlockDates = async (type: TabType, id: string, currentBlocked: string[], newDates: string[]) => {
    const merged = [...new Set([...currentBlocked, ...newDates])];
    if (type === "villas") await updateVilla(id, { blockedDates: merged });
    if (type === "cars") await updateCar(id, { blockedDates: merged });
    if (type === "yachts") await updateYacht(id, { blockedDates: merged });
  };

  // Unblock dates handler
  const handleUnblockDates = async (type: TabType, id: string, currentBlocked: string[], datesToRemove: string[]) => {
    const filtered = currentBlocked.filter((d) => !datesToRemove.includes(d));
    if (type === "villas") await updateVilla(id, { blockedDates: filtered });
    if (type === "cars") await updateCar(id, { blockedDates: filtered });
    if (type === "yachts") await updateYacht(id, { blockedDates: filtered });
  };

  const tabs = [
    { id: "villas" as TabType, label: "Villas", icon: Home, count: villas.length },
    { id: "cars" as TabType, label: "Cars", icon: Car, count: cars.length },
    { id: "yachts" as TabType, label: "Yachts", icon: Ship, count: yachts.length },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header title="Inventory" />

      <div className="p-6 space-y-6 overflow-auto">
        {/* Tabs and Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-black"
                    : "bg-card text-gray-400 hover:text-white"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? "bg-black/20" : "bg-white/10"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="px-3 py-2 bg-card border border-border rounded-lg text-white text-sm"
            >
              <option value="all">All Sources</option>
              <option value="shift">Shift Fleet</option>
            </select>

            {/* Add Button */}
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add {activeTab === "villas" ? "Villa" : activeTab === "cars" ? "Car" : "Yacht"}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Image</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Name</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Location</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Price</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Source</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Featured</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : activeTab === "villas" ? (
                filteredVillas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No villas found. Click "Add Villa" to create your first listing.
                    </td>
                  </tr>
                ) : (
                  filteredVillas.map((villa) => (
                    <tr key={villa.id} className="border-b border-border hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div className="w-16 h-12 bg-gray-700 rounded-lg overflow-hidden">
                          {villa.images[0] && (
                            <img src={villa.images[0]} alt={villa.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{villa.name}</p>
                        <p className="text-gray-500 text-sm">{villa.bedrooms} beds · {villa.maxGuests} guests</p>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{villa.location}</td>
                      <td className="px-6 py-4 text-white">${villa.pricePerNight}/night</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          villa.sourceType === "shift_fleet"
                            ? "bg-purple-500/20 text-purple-400"
                            : villa.sourceType === "pms"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-green-500/20 text-green-400"
                        }`}>
                          {villa.sourceType === "shift_fleet" ? "Shift Fleet" : villa.sourceType === "pms" ? `PMS: ${villa.sourceName}` : villa.sourceName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus("villas", villa.id, villa.status)}
                          className={`p-2 rounded-lg transition-colors ${
                            villa.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {villa.status === "active" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleFeatured("villas", villa.id, villa.featured)}
                          className={`p-2 rounded-lg transition-colors ${
                            villa.featured ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-500/20 text-gray-500"
                          }`}
                        >
                          <Star className={`h-4 w-4 ${villa.featured ? "fill-current" : ""}`} />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCalendarVilla(villa)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Availability Calendar"
                          >
                            <Calendar className="h-4 w-4 text-primary" />
                          </button>
                          <button
                            onClick={() => setEditingVilla(villa)}
                            disabled={villa.sourceType !== "shift_fleet"}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
                          >
                            <Pencil className="h-4 w-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDelete("villas", villa.id, villa.sourceType)}
                            disabled={villa.sourceType !== "shift_fleet"}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : activeTab === "cars" ? (
                filteredCars.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No cars found. Click "Add Car" to create your first listing.
                    </td>
                  </tr>
                ) : (
                  filteredCars.map((car) => (
                    <tr key={car.id} className="border-b border-border hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div className="w-16 h-12 bg-gray-700 rounded-lg overflow-hidden">
                          {car.images[0] && (
                            <img src={car.images[0]} alt={car.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{car.name}</p>
                        <p className="text-gray-500 text-sm">{car.bodyStyle} · {car.seats} seats</p>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{car.location}</td>
                      <td className="px-6 py-4 text-white">${car.pricePerDay}/day</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          car.source === "manual" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {car.source === "manual" ? "Shift Fleet" : car.provider}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus("cars", car.id, car.status)}
                          className={`p-2 rounded-lg transition-colors ${
                            car.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {car.status === "active" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleFeatured("cars", car.id, car.featured)}
                          className={`p-2 rounded-lg transition-colors ${
                            car.featured ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-500/20 text-gray-500"
                          }`}
                        >
                          <Star className={`h-4 w-4 ${car.featured ? "fill-current" : ""}`} />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCalendarCar(car)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Availability Calendar"
                          >
                            <Calendar className="h-4 w-4 text-primary" />
                          </button>
                          <button
                            onClick={() => setEditingCar(car)}
                            disabled={car.source === "api"}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
                          >
                            <Pencil className="h-4 w-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDelete("cars", car.id, car.source)}
                            disabled={car.source === "api"}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                filteredYachts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No yachts found. Click "Add Yacht" to create your first listing.
                    </td>
                  </tr>
                ) : (
                  filteredYachts.map((yacht) => (
                    <tr key={yacht.id} className="border-b border-border hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div className="w-16 h-12 bg-gray-700 rounded-lg overflow-hidden">
                          {yacht.images[0] && (
                            <img src={yacht.images[0]} alt={yacht.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{yacht.name}</p>
                        <p className="text-gray-500 text-sm">{yacht.length}ft · {yacht.maxGuests} guests</p>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{yacht.location}</td>
                      <td className="px-6 py-4 text-white">${yacht.pricePerHour}/hour</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          yacht.source === "manual" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {yacht.source === "manual" ? "Shift Fleet" : yacht.provider}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus("yachts", yacht.id, yacht.status)}
                          className={`p-2 rounded-lg transition-colors ${
                            yacht.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {yacht.status === "active" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleFeatured("yachts", yacht.id, yacht.featured)}
                          className={`p-2 rounded-lg transition-colors ${
                            yacht.featured ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-500/20 text-gray-500"
                          }`}
                        >
                          <Star className={`h-4 w-4 ${yacht.featured ? "fill-current" : ""}`} />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCalendarYacht(yacht)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Availability Calendar"
                          >
                            <Calendar className="h-4 w-4 text-primary" />
                          </button>
                          <button
                            onClick={() => setEditingYacht(yacht)}
                            disabled={yacht.source === "api"}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
                          >
                            <Pencil className="h-4 w-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDelete("yachts", yacht.id, yacht.source)}
                            disabled={yacht.source === "api"}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
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

      {/* Availability Calendars */}
      {calendarVilla && (
        <AvailabilityCalendar
          itemName={calendarVilla.name}
          itemType="villa"
          blockedDates={calendarVilla.blockedDates || []}
          readOnlyCalendar={calendarVilla.readOnlyCalendar}
          syncStatus={calendarVilla.syncStatus}
          lastSyncedAt={calendarVilla.lastSyncedAt}
          onBlockDates={(dates) => handleBlockDates("villas", calendarVilla.id, calendarVilla.blockedDates || [], dates)}
          onUnblockDates={(dates) => handleUnblockDates("villas", calendarVilla.id, calendarVilla.blockedDates || [], dates)}
          onClose={() => setCalendarVilla(null)}
        />
      )}
      {calendarCar && (
        <AvailabilityCalendar
          itemName={calendarCar.name}
          itemType="car"
          blockedDates={calendarCar.blockedDates || []}
          readOnlyCalendar={calendarCar.source === "api"}
          onBlockDates={(dates) => handleBlockDates("cars", calendarCar.id, calendarCar.blockedDates || [], dates)}
          onUnblockDates={(dates) => handleUnblockDates("cars", calendarCar.id, calendarCar.blockedDates || [], dates)}
          onClose={() => setCalendarCar(null)}
        />
      )}
      {calendarYacht && (
        <AvailabilityCalendar
          itemName={calendarYacht.name}
          itemType="yacht"
          blockedDates={calendarYacht.blockedDates || []}
          readOnlyCalendar={calendarYacht.source === "api"}
          onBlockDates={(dates) => handleBlockDates("yachts", calendarYacht.id, calendarYacht.blockedDates || [], dates)}
          onUnblockDates={(dates) => handleUnblockDates("yachts", calendarYacht.id, calendarYacht.blockedDates || [], dates)}
          onClose={() => setCalendarYacht(null)}
        />
      )}
    </div>
  );
};

export default Inventory;
