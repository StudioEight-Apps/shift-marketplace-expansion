import { useState } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import PhotoGrid from "./PhotoGrid";
import { Yacht, addYacht, updateYacht } from "@/lib/listings";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface AddYachtModalProps {
  yacht: Yacht | null;
  onClose: () => void;
}

const AMENITIES_OPTIONS = [
  "Captain", "Chef", "Crew", "Jet Skis", "Snorkeling Gear", "Diving Gear",
  "Open Bar", "Sound System", "DJ Setup", "Tender", "Kayaks", "Paddleboards"
];

const MARKET_OPTIONS = [
  "Miami, FL",
  "Los Angeles, CA",
  "New York City, NY",
  "Las Vegas, NV",
  "Scottsdale, AZ",
  "Aspen, CO",
  "Austin, TX",
  "Chicago, IL",
  "Nashville, TN",
  "The Hamptons, NY",
  "Park City, UT"
];

const AddYachtModal = ({ yacht, onClose }: AddYachtModalProps) => {
  const isEditing = !!yacht;

  const [form, setForm] = useState({
    name: yacht?.name || "",
    length: yacht?.length || "",
    location: yacht?.location || "Miami, FL",
    description: yacht?.description || "",
    pricePerHour: yacht?.pricePerHour || "",
    depositAmount: yacht?.depositAmount || "",
    maxGuests: yacht?.maxGuests || "",
    captainIncluded: yacht?.captainIncluded ?? (yacht as any)?.crewIncluded ?? true,
    amenities: yacht?.amenities || [],
    status: yacht?.status || "active" as const,
    featured: yacht?.featured || false,
  });

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>(yacht?.images || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customAmenity, setCustomAmenity] = useState("");

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotoFiles((prev) => [...prev, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (index: number) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photoFiles.length === 0) return [];

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of photoFiles) {
        const fileName = `yachts/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        uploadedUrls.push(url);
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
      alert("Failed to upload photos");
    } finally {
      setUploading(false);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const newPhotoUrls = await uploadPhotos();
      const allImages = [...existingPhotos, ...newPhotoUrls];

      const yachtData = {
        name: form.name,
        length: Number(form.length),
        location: form.location,
        description: form.description,
        pricePerHour: Number(form.pricePerHour),
        depositAmount: Number(form.depositAmount) || 0,
        maxGuests: Number(form.maxGuests),
        captainIncluded: form.captainIncluded,
        amenities: form.amenities,
        images: allImages,
        provider: "shift_fleet",
        providerId: yacht?.providerId || `manual_${Date.now()}`,
        source: "manual" as const,
        blockedDates: yacht?.blockedDates || [],
        status: form.status,
        featured: form.featured,
      };

      if (isEditing) {
        await updateYacht(yacht.id, yachtData);
      } else {
        await addYacht(yachtData);
      }

      onClose();
    } catch (error) {
      console.error("Error saving yacht:", error);
      alert("Failed to save yacht");
    } finally {
      setSaving(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const addCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (!trimmed) return;

    const exists = form.amenities.some(a => a.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      alert("This amenity already exists");
      return;
    }

    setForm((prev) => ({
      ...prev,
      amenities: [...prev.amenities, trimmed],
    }));
    setCustomAmenity("");
  };

  const removeAmenity = (amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((a) => a !== amenity),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-semibold text-foreground">
            {isEditing ? "Edit Yacht" : "Add New Yacht"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
              required
            />
          </div>

          {/* Market/Location */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Market *</label>
            <select
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
              required
            >
              {MARKET_OPTIONS.map((market) => (
                <option key={market} value={market}>{market}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground resize-none"
              rows={3}
            />
          </div>

          {/* Grid: Price, Length, Guests */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Price per Hour *</label>
              <input
                type="number"
                value={form.pricePerHour}
                onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
                min="1"
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Deposit Amount ($)</label>
              <input
                type="number"
                value={form.depositAmount}
                onChange={(e) => setForm({ ...form, depositAmount: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Length (ft) *</label>
              <input
                type="number"
                value={form.length}
                onChange={(e) => setForm({ ...form, length: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
                min="1"
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Max Guests *</label>
              <input
                type="number"
                value={form.maxGuests}
                onChange={(e) => setForm({ ...form, maxGuests: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
                min="1"
                placeholder="0"
                required
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="captainIncluded"
                checked={form.captainIncluded}
                onChange={(e) => setForm({ ...form, captainIncluded: e.target.checked })}
                className="w-5 h-5 rounded border-border"
              />
              <label htmlFor="captainIncluded" className="text-foreground">Captain Included</label>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Amenities</label>

            {/* Selected Amenities */}
            {form.amenities.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">Selected Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {form.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm"
                    >
                      <span>{amenity}</span>
                      <button
                        type="button"
                        onClick={() => removeAmenity(amenity)}
                        className="ml-1 hover:bg-primary-foreground/10 rounded p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Select Amenities */}
            <p className="text-xs text-muted-foreground mb-2">Quick Select</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {AMENITIES_OPTIONS.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    form.amenities.includes(amenity)
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary"
                  }`}
                  disabled={form.amenities.includes(amenity)}
                >
                  {amenity}
                </button>
              ))}
            </div>

            {/* Add Custom Amenity */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomAmenity())}
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
              />
              <button
                type="button"
                onClick={addCustomAmenity}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90"
              >
                Add
              </button>
            </div>
          </div>

          {/* Photos */}
          <PhotoGrid
            existingPhotos={existingPhotos}
            photoFiles={photoFiles}
            onReorderExisting={setExistingPhotos}
            onReorderNew={setPhotoFiles}
            onRemoveExisting={removeExistingPhoto}
            onRemoveNew={removePhoto}
            onAddFiles={(files) => setPhotoFiles((prev) => [...prev, ...files])}
          />

          {/* Status & Featured */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Status *</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "hidden" })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
                required
              >
                <option value="active">Active (Visible)</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Featured</label>
              <div className="flex items-center h-full">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="w-5 h-5 rounded border-border bg-background checked:bg-primary"
                  />
                  <span className="text-foreground">Mark as featured</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading || saving}
              className="flex-1 py-3 bg-background border border-border text-foreground rounded-lg hover:bg-accent/50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || saving}
              className="flex-1 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {uploading ? "Uploading Photos..." : saving ? "Saving..." : isEditing ? "Update Yacht" : "Add Yacht"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddYachtModal;
