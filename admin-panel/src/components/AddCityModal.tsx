import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { addCity, updateCity, type CityDoc } from "@/lib/cities";

interface AddCityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editCity?: CityDoc | null;
  existingCities: CityDoc[];
}

const AddCityModal = ({
  open,
  onOpenChange,
  editCity,
  existingCities,
}: AddCityModalProps) => {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [locationKey, setLocationKey] = useState("");
  const [hasYachts, setHasYachts] = useState(false);
  const [sharedWith, setSharedWith] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState(0);
  const [enabled, setEnabled] = useState(true);

  const isEditing = !!editCity;

  // Populate form when editing
  useEffect(() => {
    if (editCity) {
      setName(editCity.name);
      setState(editCity.state);
      setLocationKey(editCity.locationKey);
      setHasYachts(editCity.hasYachts);
      setSharedWith(editCity.sharedWith);
      setSortOrder(editCity.sortOrder);
      setEnabled(editCity.enabled);
    } else {
      setName("");
      setState("");
      setLocationKey("");
      setHasYachts(false);
      setSharedWith([]);
      setSortOrder(existingCities.length);
      setEnabled(true);
    }
  }, [editCity, open, existingCities.length]);

  // Auto-generate slug and locationKey from name + state
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();

  // Auto-set locationKey when name/state change (only in add mode)
  useEffect(() => {
    if (!isEditing && name && state) {
      setLocationKey(`${name}, ${state.toUpperCase()}`);
    }
  }, [name, state, isEditing]);

  const toggleSharedCity = (cityId: string) => {
    setSharedWith((prev) =>
      prev.includes(cityId)
        ? prev.filter((id) => id !== cityId)
        : [...prev, cityId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !state.trim() || !locationKey.trim()) {
      toast.error("Name, state, and location key are required");
      return;
    }

    setSaving(true);
    try {
      if (isEditing && editCity) {
        await updateCity(editCity.id, {
          name: name.trim(),
          state: state.trim().toUpperCase(),
          locationKey: locationKey.trim(),
          hasYachts,
          sharedWith,
          sortOrder,
          enabled,
        });
        toast.success(`${name} updated`);
      } else {
        if (!slug) {
          toast.error("Invalid city name");
          setSaving(false);
          return;
        }
        // Check for duplicate slug
        if (existingCities.some((c) => c.id === slug)) {
          toast.error(`A city with ID "${slug}" already exists`);
          setSaving(false);
          return;
        }
        await addCity({
          id: slug,
          name: name.trim(),
          state: state.trim().toUpperCase(),
          locationKey: locationKey.trim(),
          hasYachts,
          sharedWith,
          sortOrder,
          enabled,
        });
        toast.success(`${name} added`);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving city:", error);
      toast.error("Failed to save city");
    }
    setSaving(false);
  };

  // Other cities to choose from for sharedWith (exclude self)
  const otherCities = existingCities.filter(
    (c) => c.id !== (editCity?.id || slug)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? `Edit ${editCity.name}` : "Add City"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Name + State */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>City Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Fort Lauderdale"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="FL"
                maxLength={2}
                required
              />
            </div>
          </div>

          {/* Slug preview */}
          {!isEditing && slug && (
            <p className="text-xs text-muted-foreground">
              ID: <span className="font-mono">{slug}</span>
            </p>
          )}

          {/* Location Key */}
          <div className="space-y-1.5">
            <Label>Location Key</Label>
            <Input
              value={locationKey}
              onChange={(e) => setLocationKey(e.target.value)}
              placeholder="Fort Lauderdale, FL"
              required
            />
            <p className="text-xs text-muted-foreground">
              Must match the location/market string used on inventory items
            </p>
          </div>

          {/* Sort Order */}
          <div className="space-y-1.5">
            <Label>Sort Order</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between">
            <Label>Has Yachts</Label>
            <Switch checked={hasYachts} onCheckedChange={setHasYachts} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Enabled</Label>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {/* Shared With */}
          <div className="space-y-2">
            <Label>Share Inventory With</Label>
            <p className="text-xs text-muted-foreground">
              Selecting a city means both cities will show each other's listings
            </p>
            {otherCities.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {otherCities.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => toggleSharedCity(city.id)}
                    className={`text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                      sharedWith.includes(city.id)
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {city.name}, {city.state}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No other cities to share with yet
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : "Add City"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCityModal;
