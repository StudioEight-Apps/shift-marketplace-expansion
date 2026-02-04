import { useState } from "react";
import { X } from "lucide-react";
import { Car, addCar, updateCar } from "@/lib/listings";

interface AddCarModalProps {
  car: Car | null;
  onClose: () => void;
}

const BODY_STYLES = ["SUV", "Sedan", "Coupe", "Convertible", "Supercar"];

const AddCarModal = ({ car, onClose }: AddCarModalProps) => {
  const isEditing = !!car;

  const [form, setForm] = useState({
    name: car?.name || "",
    brand: car?.brand || "",
    model: car?.model || "",
    location: car?.location || "Miami",
    description: car?.description || "",
    pricePerDay: car?.pricePerDay || 0,
    bodyStyle: car?.bodyStyle || "SUV",
    seats: car?.seats || 4,
    power: car?.power || "",
    imageUrl: car?.images[0] || "",
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const carData = {
        name: form.name,
        brand: form.brand,
        model: form.model,
        location: form.location,
        description: form.description,
        pricePerDay: Number(form.pricePerDay),
        bodyStyle: form.bodyStyle,
        seats: Number(form.seats),
        power: form.power,
        images: form.imageUrl ? [form.imageUrl] : [],
        provider: "shift_fleet",
        providerId: car?.providerId || `manual_${Date.now()}`,
        source: "manual" as const,
        blockedDates: car?.blockedDates || [],
        status: car?.status || "active" as const,
        featured: car?.featured || false,
      };

      if (isEditing) {
        await updateCar(car.id, carData);
      } else {
        await addCar(carData);
      }

      onClose();
    } catch (error) {
      console.error("Error saving car:", error);
      alert("Failed to save car");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">
            {isEditing ? "Edit Car" : "Add New Car"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Display Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white"
              placeholder="Lamborghini Urus"
              required
            />
          </div>

          {/* Brand & Model */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Brand *</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white"
                placeholder="Lamborghini"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Model *</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white"
                placeholder="Urus"
                required
              />
            </div>
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
              placeholder="Experience the thrill of..."
            />
          </div>

          {/* Grid: Price, Body Style, Seats, Power */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Price per Day *</label>
              <input
                type="number"
                value={form.pricePerDay}
                onChange={(e) => setForm({ ...form, pricePerDay: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Body Style *</label>
              <select
                value={form.bodyStyle}
                onChange={(e) => setForm({ ...form, bodyStyle: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white"
                required
              >
                {BODY_STYLES.map((style) => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Seats *</label>
              <input
                type="number"
                value={form.seats}
                onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Power</label>
              <input
                type="text"
                value={form.power}
                onChange={(e) => setForm({ ...form, power: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white"
                placeholder="641 HP"
              />
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
              {saving ? "Saving..." : isEditing ? "Update Car" : "Add Car"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCarModal;
