import { useState, useEffect, useRef } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import PhotoGrid from "./PhotoGrid";
import { Villa, addVilla, updateVilla } from "@/lib/listings";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface AddVillaModalProps {
  villa: Villa | null;
  onClose: () => void;
}

const AMENITIES_OPTIONS = [
  "Pool", "Waterfront", "Private Beach", "Chef", "Hot Tub", "Gym",
  "Wine Cellar", "Home Theater", "Tennis Court", "Ocean View", "City View",
  "Concierge", "Security", "Dock", "Helipad"
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

const AddVillaModal = ({ villa, onClose }: AddVillaModalProps) => {
  const isEditing = !!villa;

  const [form, setForm] = useState({
    name: villa?.name || "",
    market: villa?.market || "Miami, FL",
    address: villa?.address || "",
    city: villa?.city || "",
    neighborhood: villa?.neighborhood || "",
    state: villa?.state || "",
    zipCode: villa?.zipCode || "",
    description: villa?.description || "",
    pricePerNight: villa?.pricePerNight || "",
    cleaningFee: villa?.cleaningFee || "",
    depositAmount: villa?.depositAmount || "",
    bedrooms: villa?.bedrooms || "",
    bathrooms: villa?.bathrooms || "",
    maxGuests: villa?.maxGuests || "",
    amenities: villa?.amenities || [],
    minimumStay: villa?.minimumStay || "",
    status: villa?.status || "active" as const,
    featured: villa?.featured || false,
  });

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>(villa?.images || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [customAmenity, setCustomAmenity] = useState("");

  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    console.log("Google Maps API Key present:", !!apiKey);

    if (!apiKey) {
      console.warn("No Google Maps API key - autocomplete disabled");
      return;
    }

    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google?.maps?.places) {
        console.log("Google Maps already loaded, initializing autocomplete");
        initAutocomplete();
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log("Google Maps script already in DOM, waiting for load");
        existingScript.addEventListener('load', initAutocomplete);
        return;
      }

      console.log("Loading Google Maps script");
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("Google Maps script loaded successfully");
        initAutocomplete();
      };
      script.onerror = (error) => {
        console.error("Failed to load Google Maps script:", error);
      };
      document.head.appendChild(script);
    };

    const initAutocomplete = () => {
      if (!addressInputRef.current) {
        console.warn("Address input ref not available");
        return;
      }

      if (autocompleteRef.current) {
        console.log("Autocomplete already initialized");
        return;
      }

      if (!window.google?.maps?.places) {
        console.error("Google Maps Places library not loaded");
        return;
      }

      console.log("Initializing Google Places Autocomplete");
      try {
        autocompleteRef.current = new google.maps.places.Autocomplete(
          addressInputRef.current,
          {
            types: ["address"],
            componentRestrictions: { country: "us" },
          }
        );

        autocompleteRef.current.addListener("place_changed", handlePlaceSelect);
        console.log("Autocomplete initialized successfully");
        updateAutocompleteBounds();
      } catch (error) {
        console.error("Error initializing autocomplete:", error);
      }
    };

    loadGoogleMaps();

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  // Update autocomplete bounds when market changes
  useEffect(() => {
    updateAutocompleteBounds();
  }, [form.market]);

  const updateAutocompleteBounds = () => {
    if (!autocompleteRef.current || !window.google?.maps) return;

    // Geocode the market to get its location and bias results
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: form.market }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const location = results[0].geometry.location;
        const bounds = new google.maps.Circle({
          center: location,
          radius: 50000, // 50km radius
        }).getBounds();

        if (bounds) {
          autocompleteRef.current?.setBounds(bounds);
          console.log(`Autocomplete biased to ${form.market}`);
        }
      }
    });
  };

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place || !place.address_components || !place.geometry) return;

    const components = place.address_components;
    let streetNumber = "";
    let route = "";
    let city = "";
    let state = "";
    let zipCode = "";
    let neighborhood = "";

    components.forEach((component) => {
      const types = component.types;
      if (types.includes("street_number")) streetNumber = component.long_name;
      if (types.includes("route")) route = component.long_name;
      if (types.includes("locality")) city = component.long_name;
      if (types.includes("administrative_area_level_1")) state = component.short_name;
      if (types.includes("postal_code")) zipCode = component.long_name;
      if (types.includes("neighborhood")) neighborhood = component.long_name;
      if (!neighborhood && types.includes("sublocality_level_1")) neighborhood = component.long_name;
    });

    const fullAddress = `${streetNumber} ${route}`.trim();
    const lat = place.geometry.location?.lat();
    const lng = place.geometry.location?.lng();

    setForm((prev) => ({
      ...prev,
      address: fullAddress || prev.address,
      city: city || prev.city,
      state: state || prev.state,
      zipCode: zipCode || prev.zipCode,
      neighborhood: neighborhood, // Always set, even if empty string
    }));
  };

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
        const fileName = `villas/${Date.now()}_${file.name}`;
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

  const geocodeAddress = async (fullAddress: string): Promise<{ lat: number; lng: number } | null> => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const newPhotoUrls = await uploadPhotos();
      const allImages = [...existingPhotos, ...newPhotoUrls];
      const mainImageUrl = allImages.length > 0 ? allImages[0] : null;

      // Geocode if needed (for coordinates only, address details already from autocomplete)
      let geoData: { lat: number; lng: number } | null = null;
      if (form.address) {
        const fullAddress = `${form.address}, ${form.city}, ${form.state} ${form.zipCode}`;
        geoData = await geocodeAddress(fullAddress);
      }

      const villaData = {
        name: form.name,
        market: form.market,
        address: form.address,
        city: form.city,
        neighborhood: form.neighborhood,
        state: form.state,
        zipCode: form.zipCode,
        location: form.market,
        description: form.description,
        pricePerNight: Number(form.pricePerNight),
        cleaningFee: Number(form.cleaningFee) || 0,
        depositAmount: Number(form.depositAmount) || 0,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        maxGuests: Number(form.maxGuests),
        amenities: form.amenities,
        images: allImages,
        mainImageUrl,
        lat: geoData?.lat ?? null,
        lng: geoData?.lng ?? null,
        sourceType: "shift_fleet" as const,
        sourceName: "shift",
        externalId: null,
        syncStatus: "n/a" as const,
        lastSyncedAt: null,
        readOnlyCalendar: false,
        blockedDates: villa?.blockedDates || [],
        minimumStay: Number(form.minimumStay),
        status: form.status,
        featured: form.featured,
      };

      if (isEditing) {
        await updateVilla(villa.id, villaData);
      } else {
        await addVilla(villaData);
      }

      onClose();
    } catch (error) {
      console.error("Error saving villa:", error);
      alert("Failed to save villa");
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

    // Check if amenity already exists (case-insensitive)
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
      <div className="bg-card border border-border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-semibold text-foreground">
            {isEditing ? "Edit Villa" : "Add New Villa"}
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

          {/* Market */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Market *</label>
            <select
              value={form.market}
              onChange={(e) => setForm({ ...form, market: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
              required
            >
              {MARKET_OPTIONS.map((market) => (
                <option key={market} value={market}>{market}</option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">
              Street Address *
            </label>
            <input
              ref={addressInputRef}
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
              autoComplete="new-password"
              name="address-autocomplete-disabled"
              id="address-field-unique"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              This address will not be available to users view unless they book it successfully
            </p>
          </div>

          {/* City, State, Zip */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">City *</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">State *</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
                maxLength={2}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Zip Code *</label>
              <input
                type="text"
                value={form.zipCode}
                onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
                required
              />
            </div>
          </div>

          {/* Neighborhood */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Neighborhood</label>
            <input
              type="text"
              value={form.neighborhood}
              onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground resize-none"
              rows={3}
              required
            />
          </div>

          {/* Grid: Price, Bedrooms, Bathrooms, Guests */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Price per Night *</label>
              <input
                type="number"
                value={form.pricePerNight}
                onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Minimum Stay (nights) *</label>
              <input
                type="number"
                value={form.minimumStay}
                onChange={(e) => setForm({ ...form, minimumStay: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Cleaning Fee ($)</label>
              <input
                type="number"
                value={form.cleaningFee}
                onChange={(e) => setForm({ ...form, cleaningFee: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
                placeholder="0"
                min="0"
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
              <label className="block text-sm text-muted-foreground mb-1.5">Bedrooms *</label>
              <input
                type="number"
                value={form.bedrooms}
                onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Bathrooms *</label>
              <input
                type="number"
                value={form.bathrooms}
                onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground"
                min="0.5"
                step="0.5"
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
                required
              />
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
              {uploading ? "Uploading Photos..." : saving ? "Saving..." : isEditing ? "Update Villa" : "Add Villa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVillaModal;
