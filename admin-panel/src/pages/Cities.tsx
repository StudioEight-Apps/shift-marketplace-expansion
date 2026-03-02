import { useEffect, useState } from "react";
import {
  subscribeToCities,
  deleteCity,
  updateCity,
  seedCities,
  type CityDoc,
} from "@/lib/cities";
import { useAuth } from "@/context/AuthContext";
import { hasPermission } from "@/lib/permissions";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Ship,
  Link2,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AddCityModal from "@/components/AddCityModal";

const Cities = () => {
  const { role } = useAuth();
  const canManage = role ? hasPermission(role, "manage_cities") : false;

  const [cities, setCities] = useState<CityDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editCity, setEditCity] = useState<CityDoc | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CityDoc | null>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCities((fetched) => {
      setCities(fetched);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleToggleEnabled = async (city: CityDoc) => {
    try {
      await updateCity(city.id, { enabled: !city.enabled });
      toast.success(`${city.name} ${city.enabled ? "disabled" : "enabled"}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update city");
    }
  };

  const handleToggleYachts = async (city: CityDoc) => {
    try {
      await updateCity(city.id, { hasYachts: !city.hasYachts });
      toast.success(
        `Yachts ${city.hasYachts ? "hidden" : "shown"} for ${city.name}`
      );
    } catch (e) {
      console.error(e);
      toast.error("Failed to update city");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCity(deleteTarget.id);
      toast.success(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete city");
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const count = await seedCities();
      toast.success(`Seeded ${count} cities`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to seed cities");
    }
    setSeeding(false);
  };

  const handleEdit = (city: CityDoc) => {
    setEditCity(city);
    setAddModalOpen(true);
  };

  const handleCloseModal = (open: boolean) => {
    setAddModalOpen(open);
    if (!open) setEditCity(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-border px-6 py-4">
          <h1 className="text-lg font-semibold text-foreground">Cities</h1>
        </div>
        <div className="p-6 text-muted-foreground">Loading cities...</div>
      </div>
    );
  }

  const isEmpty = cities.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Cities</h1>
          <p className="text-sm text-muted-foreground">
            {cities.length} {cities.length === 1 ? "city" : "cities"} configured
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            {isEmpty && (
              <Button
                variant="outline"
                onClick={handleSeed}
                disabled={seeding}
              >
                <Download className="h-4 w-4 mr-1" />
                {seeding ? "Seeding..." : "Seed Default Cities"}
              </Button>
            )}
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add City
            </Button>
          </div>
        )}
      </div>

      {/* Cities Table */}
      <div className="p-6 overflow-auto">
        {isEmpty ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No cities configured yet. Seed the default cities to get started.
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    City
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Location Key
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Shared With
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                    Yachts
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                    Enabled
                  </th>
                  {canManage && (
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {cities.map((city) => (
                  <tr
                    key={city.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {city.name}, {city.state}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {city.id}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {city.locationKey}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {city.sharedWith.length > 0 ? (
                          city.sharedWith.map((id) => {
                            const shared = cities.find((c) => c.id === id);
                            return (
                              <Badge
                                key={id}
                                variant="outline"
                                className="text-xs"
                              >
                                <Link2 className="h-3 w-3 mr-1" />
                                {shared?.name || id}
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {canManage ? (
                        <Switch
                          checked={city.hasYachts}
                          onCheckedChange={() => handleToggleYachts(city)}
                        />
                      ) : city.hasYachts ? (
                        <Ship className="h-4 w-4 text-cyan-500 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {canManage ? (
                        <Switch
                          checked={city.enabled}
                          onCheckedChange={() => handleToggleEnabled(city)}
                        />
                      ) : (
                        <Badge
                          variant={city.enabled ? "default" : "secondary"}
                        >
                          {city.enabled ? "Yes" : "No"}
                        </Badge>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(city)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(city)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AddCityModal
        open={addModalOpen}
        onOpenChange={handleCloseModal}
        editCity={editCity}
        existingCities={cities}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete City
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete{" "}
              <strong className="text-foreground">
                {deleteTarget?.name}, {deleteTarget?.state}
              </strong>
              ? This will remove it from the city selector on the main site.
              Existing inventory in this city will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete City
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Cities;
