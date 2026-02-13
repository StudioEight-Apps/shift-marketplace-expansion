import { useState, useRef } from "react";
import { X, Home, Car, Ship, ArrowLeft, Send, CheckCircle2, ImagePlus, Trash2 } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useContact } from "@/context/ContactContext";
import { notifyListWithUs } from "@/lib/notify";
import { toast } from "sonner";

type ListingType = "villa" | "car" | "yacht" | null;

const MAX_PHOTOS = 8;

const MARKETS = [
  "Aspen, CO",
  "Austin, TX",
  "Chicago, IL",
  "Las Vegas, NV",
  "Los Angeles, CA",
  "Miami, FL",
  "Nashville, TN",
  "New York City, NY",
  "Park City, UT",
  "Scottsdale, AZ",
  "The Hamptons, NY",
];

const ListWithUsModal = () => {
  const { isListOpen, closeListWithUs } = useContact();
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [listingType, setListingType] = useState<ListingType>(null);
  const [sending, setSending] = useState(false);

  // Contact fields
  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [market, setMarket] = useState("Miami, FL");
  const [notes, setNotes] = useState("");

  // Villa fields
  const [address, setAddress] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [alreadyListed, setAlreadyListed] = useState(false);

  // Car fields
  const [carDescription, setCarDescription] = useState("");
  const [carYear, setCarYear] = useState("");

  // Yacht fields
  const [yachtName, setYachtName] = useState("");
  const [yachtLength, setYachtLength] = useState("");
  const [captainIncluded, setCaptainIncluded] = useState(true);

  // Photo upload
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isListOpen) return null;

  const resetForm = () => {
    setStep(1);
    setListingType(null);
    setName(user?.displayName || "");
    setEmail(user?.email || "");
    setPhone("");
    setMarket("Miami, FL");
    setNotes("");
    setAddress("");
    setBedrooms("");
    setBathrooms("");
    setAlreadyListed(false);
    setCarDescription("");
    setCarYear("");
    setYachtName("");
    setYachtLength("");
    setCaptainIncluded(true);
    setPhotos([]);
    setPhotoPreviews([]);
  };

  const handleClose = () => {
    resetForm();
    closeListWithUs();
  };

  const selectType = (type: ListingType) => {
    setListingType(type);
    setStep(2);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - photos.length;
    const newFiles = files.slice(0, remaining);

    if (files.length > remaining) {
      toast.info(`Maximum ${MAX_PHOTOS} photos. Only ${remaining} more can be added.`);
    }

    // Generate previews
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setPhotos((prev) => [...prev, ...newFiles]);

    // Reset input so user can re-select
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (!storage || photos.length === 0) return [];
    setUploadingPhotos(true);
    const urls: string[] = [];

    for (const photo of photos) {
      const timestamp = Date.now();
      const safeName = photo.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storageRef = ref(storage, `list-with-us/${timestamp}_${safeName}`);
      const snapshot = await uploadBytes(storageRef, photo);
      const url = await getDownloadURL(snapshot.ref);
      urls.push(url);
    }

    setUploadingPhotos(false);
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const typeLabel = listingType === "villa" ? "Villa" : listingType === "car" ? "Car" : "Yacht";

      // Upload photos first
      const photoUrls = await uploadPhotos();

      // Build type-specific details
      let details: Record<string, unknown> = {};
      if (listingType === "villa") {
        details = { address, bedrooms, bathrooms, alreadyListed };
      } else if (listingType === "car") {
        details = { carDescription, carYear };
      } else if (listingType === "yacht") {
        details = { yachtName, yachtLength, captainIncluded };
      }

      // Save to Firestore
      await addDoc(collection(db, "listWithUsInquiries"), {
        listingType: typeLabel,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        market,
        notes: notes.trim(),
        details,
        photos: photoUrls,
        userId: user?.uid || null,
        createdAt: serverTimestamp(),
        status: "new",
      });

      // Build note for GHL
      const noteLines = [
        `Type: ${typeLabel}`,
        `Market: ${market}`,
        ...(listingType === "villa" ? [
          address ? `Address: ${address}` : null,
          bedrooms ? `Bedrooms: ${bedrooms}` : null,
          bathrooms ? `Bathrooms: ${bathrooms}` : null,
          `Already on Airbnb/VRBO: ${alreadyListed ? "Yes" : "No"}`,
        ] : []),
        ...(listingType === "car" ? [
          carDescription ? `Vehicle: ${carDescription}` : null,
          carYear ? `Year: ${carYear}` : null,
        ] : []),
        ...(listingType === "yacht" ? [
          yachtName ? `Yacht Name: ${yachtName}` : null,
          yachtLength ? `Length: ${yachtLength} ft` : null,
          `Captain Included: ${captainIncluded ? "Yes" : "No"}`,
        ] : []),
        photoUrls.length > 0 ? `Photos: ${photoUrls.length} uploaded` : null,
        notes.trim() ? `Notes: ${notes.trim()}` : null,
      ].filter(Boolean).join("\n");

      // Fire-and-forget email notification
      notifyListWithUs({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        market,
        listingType: typeLabel,
        details,
        notes: notes.trim(),
        photoCount: photoUrls.length,
      });

      // Sync to GHL (fire-and-forget)
      syncToGHL({
        guestName: name.trim(),
        guestEmail: email.trim(),
        guestPhone: phone.trim(),
        assetType: `List With Us: ${typeLabel}`,
        assetName: `${typeLabel} Listing Inquiry`,
        guestNotes: noteLines,
      }).catch((err) => console.error("GHL sync failed (non-blocking):", err));

      setStep(3);
    } catch (error) {
      console.error("Error submitting listing inquiry:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-background border border-border-subtle rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card border border-border-subtle rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        {step !== 3 && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              {step === 2 && (
                <button
                  onClick={() => setStep(1)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <h2 className="text-lg font-semibold text-foreground">List with Us</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {step === 1 && (
          /* Step 1: Pick type */
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-5">
              Select listing type
            </p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { type: "villa" as const, label: "Villa", icon: Home },
                { type: "car" as const, label: "Car", icon: Car },
                { type: "yacht" as const, label: "Yacht", icon: Ship },
              ]).map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => selectType(type)}
                  className="flex flex-col items-center gap-2 p-5 rounded-xl border border-border-subtle hover:border-foreground/30 hover:bg-secondary/30 transition-all group"
                >
                  <div className="p-3 rounded-full bg-secondary/40 group-hover:bg-secondary/60 transition-colors">
                    <Icon className="h-6 w-6 text-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          /* Step 2: Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your name" required />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="(555) 123-4567" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" required />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Market *</label>
                <select value={market} onChange={(e) => setMarket(e.target.value)} className={inputClass} required>
                  {MARKETS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border-subtle pt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {listingType === "villa" ? "Property Details" : listingType === "car" ? "Vehicle Details" : "Yacht Details"}
              </p>
            </div>

            {/* Villa Fields */}
            {listingType === "villa" && (
              <>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Property Address</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="123 Ocean Dr, Miami Beach" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Bedrooms</label>
                    <input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className={inputClass} placeholder="0" min="0" />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Bathrooms</label>
                    <input type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className={inputClass} placeholder="0" min="0" />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={alreadyListed} onChange={(e) => setAlreadyListed(e.target.checked)} className="w-4 h-4 rounded border-border-subtle" />
                  <span className="text-sm text-muted-foreground">Already listed on Airbnb / VRBO</span>
                </label>
              </>
            )}

            {/* Car Fields */}
            {listingType === "car" && (
              <>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Vehicle (brand, model)</label>
                  <input type="text" value={carDescription} onChange={(e) => setCarDescription(e.target.value)} className={inputClass} placeholder="e.g. Lamborghini Urus" />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Year</label>
                  <input type="number" value={carYear} onChange={(e) => setCarYear(e.target.value)} className={inputClass} placeholder="2024" min="1990" max="2030" />
                </div>
              </>
            )}

            {/* Yacht Fields */}
            {listingType === "yacht" && (
              <>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Yacht Name</label>
                  <input type="text" value={yachtName} onChange={(e) => setYachtName(e.target.value)} className={inputClass} placeholder="e.g. Sea Breeze" />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Length (ft)</label>
                  <input type="number" value={yachtLength} onChange={(e) => setYachtLength(e.target.value)} className={inputClass} placeholder="0" min="0" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={captainIncluded} onChange={(e) => setCaptainIncluded(e.target.checked)} className="w-4 h-4 rounded border-border-subtle" />
                  <span className="text-sm text-muted-foreground">Captain included</span>
                </label>
              </>
            )}

            {/* Photo Upload Section */}
            <div className="border-t border-border-subtle pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Photos
                </p>
                <span className="text-xs text-muted-foreground">
                  {photos.length}/{MAX_PHOTOS}
                </span>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-4 gap-2">
                {photoPreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img
                      src={preview}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}

                {/* Add Photo Button */}
                {photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-border-subtle hover:border-primary/40 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-1"
                  >
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Add</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Anything else?</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} resize-none`} placeholder="Any additional details..." rows={2} />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm"
            >
              {sending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  {uploadingPhotos ? "Uploading photos..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Listing
                </>
              )}
            </button>
          </form>
        )}

        {step === 3 && (
          /* Step 3: Success */
          <div className="p-8 flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-green-500/10 p-4">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Listing Submitted</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Your listing was submitted for review. A Shift representative will be in touch shortly to go over the next steps.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

async function syncToGHL(data: Record<string, unknown>) {
  const baseUrl = window.location.hostname === "localhost"
    ? ""
    : "https://adoring-ptolemy.vercel.app";
  const res = await fetch(`${baseUrl}/api/ghl-sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GHL sync HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

export default ListWithUsModal;
