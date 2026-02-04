import { useState } from "react";
import { X } from "lucide-react";
import { Yacht, addYacht, updateYacht } from "@/lib/listings";

interface AddYachtModalProps {
  yacht: Yacht | null;
  onClose: () => void;
}

const AMENITIES_OPTIONS = [
  "Captain", "Chef", "Crew", "Jet Skis", "Snorkeling Gear", "Diving Gear",
  "Open Bar", "Sound System", "DJ Setup", "Tender", "Kayaks", "Paddleboards"
];

const AddYachtModal = ({ yacht, onClose }: AddYachtModalProps) => {
  const isEditing = !!yacht;

  const [form, setForm] = useState({
    name: yacht?.name || "",
    length: yacht?.length || 0,
    location: yacht?.location || "Miami",
    description: yacht?.description || "",
    pricePerHour: yacht?.pricePerHour || 0,
    maxGuests: yacht?.maxGuests || 0,
    crewIncluded: yacht?.crewIncluded ?? true,
    amenities: yacht?.amenities || [],
    imageUrl: yacht?.images[0] || "",
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const yachtData = {
        name: form.name,
        length: Number(form.length),
        location: form.location,
        description: form.description,
        pricePerHour: Number(form.pricePerHour),
        maxGuests: Number(form.maxGuests),
        crewIncluded: form.crewIncluded,
        amenities: form.amenities,
        images: form.imageUrl ? [form.imageUrl] : [],
        provider: "shift_fleet",
        providerId: yacht?.providerId || `manual_${Date.now()}`,
        source: "manual" as const,
        blockedDates: yacht?.blockedDates || [],
        status: yacht?.status || "active" as const,
        featured: yacht?.featured || false,
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
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-center">
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

          {/* Location */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Location *</label>
            <select
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white"
              required
            >
              <option value="Miami">Miami</option>
              <option value="LA">LA</option>
              <option value="NYC">NYC</option>
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

          {/* Image URL */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Image URL</label>
            <input
              type="text"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">Enter a direct link to an image</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-background border border-border text-white rounded-lg hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : isEditing ? "Update Yacht" : "Add Yacht"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddYachtModal;
