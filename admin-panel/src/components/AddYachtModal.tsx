import { useState } from "react";
import { X, Upload, Trash2 } from "lucide-react";
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
  "Nashville, TN",
  "The Hamptons, NY",
  "Park City, UT"
];

const AddYachtModal = ({ yacht, onClose }: AddYachtModalProps) => {
  const isEditing = !!yacht;

  const [form, setForm] = useState({
    name: yacht?.name || "",
    length: yacht?.length || 0,
    location: yacht?.location || "Miami, FL",
    description: yacht?.description || "",
    pricePerHour: yacht?.pricePerHour || 0,
    maxGuests: yacht?.maxGuests || 0,
    crewIncluded: yacht?.crewIncluded ?? true,
    amenities: yacht?.amenities || [],
    status: yacht?.status || "active" as const,
    featured: yacht?.featured || false,
  });

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>(yacht?.images || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

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
        maxGuests: Number(form.maxGuests),
        crewIncluded: form.crewIncluded,
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-semibold text-white">
            {isEditing ? "Edit Yacht" : "Add New Yacht"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white"
              placeholder="Azure Horizon 85ft"
              required
            />
          </div>

          {/* Market/Location */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Market *</label>
            <select
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white"
              required
            >
              {MARKET_OPTIONS.map((market) => (
                <option key={market} value={market}>{market}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white resize-none"
              rows={3}
              placeholder="Luxurious yacht perfect for..."
            />
          </div>

          {/* Grid: Price, Length, Guests */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Price per Hour *</label>
              <input
                type="number"
                value={form.pricePerHour}
                onChange={(e) => setForm({ ...form, pricePerHour: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Length (ft) *</label>
              <input
                type="number"
                value={form.length}
                onChange={(e) => setForm({ ...form, length: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Max Guests *</label>
              <input
                type="number"
                value={form.maxGuests}
                onChange={(e) => setForm({ ...form, maxGuests: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white"
                min="1"
                required
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="crewIncluded"
                checked={form.crewIncluded}
                onChange={(e) => setForm({ ...form, crewIncluded: e.target.checked })}
                className="w-5 h-5 rounded border-border"
              />
              <label htmlFor="crewIncluded" className="text-white">Crew Included</label>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_OPTIONS.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    form.amenities.includes(amenity)
                      ? "bg-primary text-black"
                      : "bg-background border border-border text-gray-400 hover:text-white"
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Photos {(existingPhotos.length + photoFiles.length) > 0 && `(${existingPhotos.length + photoFiles.length} photos)`}
            </label>

            {/* Existing Photos */}
            {existingPhotos.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">Existing Photos</p>
                <div className="grid grid-cols-4 gap-3">
                  {existingPhotos.map((url, index) => (
                    <div key={url} className="relative group">
                      <img
                        src={url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-border"
                      />
                      {index === 0 && (
                        <div className="absolute top-1 left-1 bg-primary text-black text-xs px-2 py-0.5 rounded font-medium">
                          Main
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Photos Preview */}
            {photoFiles.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">New Photos (will upload on save)</p>
                <div className="grid grid-cols-4 gap-3">
                  {photoFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`New ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-border"
                      />
                      {existingPhotos.length === 0 && index === 0 && (
                        <div className="absolute top-1 left-1 bg-primary text-black text-xs px-2 py-0.5 rounded font-medium">
                          Main
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-background border-2 border-dashed border-border rounded-lg text-gray-400 hover:text-white hover:border-primary cursor-pointer transition-colors">
              <Upload className="h-5 w-5" />
              <span>Click to upload photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-1">First photo will be the main image. Upload multiple at once.</p>
          </div>

          {/* Status & Featured */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Status *</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "hidden" })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white"
                required
              >
                <option value="active">Active (Visible)</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Featured</label>
              <div className="flex items-center h-full">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="w-5 h-5 rounded border-border bg-background checked:bg-primary"
                  />
                  <span className="text-white">Mark as featured</span>
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
              className="flex-1 py-3 bg-background border border-border text-white rounded-lg hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || saving}
              className="flex-1 py-3 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50"
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
