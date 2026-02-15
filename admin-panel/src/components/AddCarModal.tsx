import { useState, useRef, useEffect } from "react";
import { X, Upload, Trash2, ChevronDown, Check } from "lucide-react";
import PhotoGrid from "./PhotoGrid";
import { Car, addCar, updateCar } from "@/lib/listings";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface AddCarModalProps {
  car: Car | null;
  onClose: () => void;
}

interface BrandOption {
  name: string;
  logo: string; // URL to brand logo
}

const BRANDS: BrandOption[] = [
  { name: "Lamborghini", logo: "https://www.carlogos.org/car-logos/lamborghini-logo.png" },
  { name: "Ferrari", logo: "https://www.carlogos.org/car-logos/ferrari-logo.png" },
  { name: "Porsche", logo: "https://www.carlogos.org/car-logos/porsche-logo.png" },
  { name: "McLaren", logo: "https://www.carlogos.org/car-logos/mclaren-logo.png" },
  { name: "Aston Martin", logo: "https://www.carlogos.org/car-logos/aston-martin-logo.png" },
  { name: "Bentley", logo: "https://www.carlogos.org/car-logos/bentley-logo.png" },
  { name: "Rolls Royce", logo: "https://www.carlogos.org/car-logos/rolls-royce-logo.png" },
  { name: "Mercedes-Benz", logo: "https://www.carlogos.org/car-logos/mercedes-benz-logo.png" },
  { name: "BMW", logo: "https://www.carlogos.org/car-logos/bmw-logo.png" },
  { name: "Chevrolet", logo: "https://www.carlogos.org/car-logos/chevrolet-logo.png" },
  { name: "Range Rover", logo: "https://www.carlogos.org/car-logos/land-rover-logo.png" },
  { name: "Land Rover", logo: "https://www.carlogos.org/car-logos/land-rover-logo.png" },
  { name: "Maserati", logo: "https://www.carlogos.org/car-logos/maserati-logo.png" },
  { name: "Bugatti", logo: "https://www.carlogos.org/car-logos/bugatti-logo.png" },
  { name: "Cadillac", logo: "https://www.carlogos.org/car-logos/cadillac-logo.png" },
  { name: "Lucid", logo: "https://www.carlogos.org/car-logos/lucid-motors-logo.png" },
  { name: "Tesla", logo: "https://www.carlogos.org/car-logos/tesla-logo.png" },
  { name: "Audi", logo: "https://www.carlogos.org/car-logos/audi-logo.png" },
  { name: "Maybach", logo: "https://www.carlogos.org/car-logos/maybach-logo.png" },
  { name: "Genesis", logo: "https://www.carlogos.org/car-logos/genesis-logo.png" },
  { name: "Lexus", logo: "https://www.carlogos.org/car-logos/lexus-logo.png" },
];

const BODY_STYLES = ["SUV", "Sedan", "Coupe", "Convertible"];

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

const AddCarModal = ({ car, onClose }: AddCarModalProps) => {
  const isEditing = !!car;

  const [form, setForm] = useState({
    name: car?.name || "",
    brand: car?.brand || "",
    location: car?.location || "Miami, FL",
    description: car?.description || "",
    pricePerDay: car?.pricePerDay || "",
    depositAmount: car?.depositAmount || "",
    bodyStyle: car?.bodyStyle || "SUV",
    seats: car?.seats || "",
    status: car?.status || "active" as const,
    featured: car?.featured || false,
  });

  const [brandOpen, setBrandOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>(car?.images || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Close brand dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(e.target as Node)) {
        setBrandOpen(false);
        setBrandSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredBrands = BRANDS.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const selectedBrand = BRANDS.find((b) => b.name === form.brand);

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
        const fileName = `cars/${Date.now()}_${file.name}`;
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

      const carData = {
        name: form.name,
        brand: form.brand,
        location: form.location,
        description: form.description,
        pricePerDay: Number(form.pricePerDay),
        depositAmount: Number(form.depositAmount) || 0,
        bodyStyle: form.bodyStyle,
        seats: Number(form.seats),
        images: allImages,
        provider: car?.provider || "shift_fleet",
        providerId: car?.providerId || `manual_${Date.now()}`,
        source: car?.source || ("manual" as const),
        blockedDates: car?.blockedDates || [],
        status: form.status,
        featured: form.featured,
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
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-semibold text-foreground">
            {isEditing ? "Edit Car" : "Add New Car"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Display Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
              required
            />
          </div>

          {/* Brand */}
          <div>
            <div ref={brandDropdownRef} className="relative">
              <label className="block text-sm text-muted-foreground mb-1.5">Brand *</label>
              {/* Hidden input for form validation */}
              <input
                type="text"
                value={form.brand}
                required
                className="sr-only"
                tabIndex={-1}
                onChange={() => {}}
              />
              <button
                type="button"
                onClick={() => { setBrandOpen(!brandOpen); setBrandSearch(""); }}
                className="w-full flex items-center justify-between px-4 py-3 bg-background border border-border rounded-lg text-foreground hover:border-primary transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  {selectedBrand ? (
                    <>
                      <img
                        src={selectedBrand.logo}
                        alt={selectedBrand.name}
                        className="w-6 h-6 object-contain shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <span>{selectedBrand.name}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Select brand</span>
                  )}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${brandOpen ? "rotate-180" : ""}`} />
              </button>

              {brandOpen && (
                <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                  {/* Search */}
                  <div className="p-2 border-b border-border">
                    <input
                      type="text"
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm focus:outline-none focus:border-primary"
                      placeholder="Search brands..."
                      autoFocus
                    />
                  </div>
                  {/* Options */}
                  <div className="max-h-56 overflow-y-auto">
                    {filteredBrands.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">No brands found</div>
                    ) : (
                      filteredBrands.map((brand) => (
                        <button
                          key={brand.name}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, brand: brand.name });
                            setBrandOpen(false);
                            setBrandSearch("");
                          }}
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                            form.brand === brand.name
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-accent/50"
                          }`}
                        >
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="w-6 h-6 object-contain shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                          <span className="flex-1 text-left">{brand.name}</span>
                          {form.brand === brand.name && (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location/Market */}
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

          {/* Grid: Price, Body Style, Seats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Price per Day *</label>
              <input
                type="number"
                value={form.pricePerDay}
                onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })}
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
              <label className="block text-sm text-muted-foreground mb-1.5">Body Style *</label>
              <select
                value={form.bodyStyle}
                onChange={(e) => setForm({ ...form, bodyStyle: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
                required
              >
                {BODY_STYLES.map((style) => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Seats *</label>
              <input
                type="number"
                value={form.seats}
                onChange={(e) => setForm({ ...form, seats: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
                min="1"
                placeholder="4"
                required
              />
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
              {uploading ? "Uploading Photos..." : saving ? "Saving..." : isEditing ? "Update Car" : "Add Car"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCarModal;
