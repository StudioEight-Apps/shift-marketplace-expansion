import { useState } from "react";
import { X, Send, CheckCircle2 } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useContact } from "@/context/ContactContext";
import { toast } from "sonner";

const ContactModal = () => {
  const { isOpen, closeContact } = useContact();
  const { user } = useAuth();

  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setName(user?.displayName || "");
    setEmail(user?.email || "");
    setPhone("");
    setMessage("");
    setSubmitted(false);
    closeContact();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      // Save to Firestore
      await addDoc(collection(db, "contactInquiries"), {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: message.trim(),
        userId: user?.uid || null,
        createdAt: serverTimestamp(),
        status: "new",
      });

      // Sync to GHL (fire-and-forget)
      syncToGHL({
        guestName: name.trim(),
        guestEmail: email.trim(),
        guestPhone: phone.trim(),
        assetType: "Contact Inquiry",
        assetName: "Contact Form",
        guestNotes: message.trim(),
      }).catch((err) => console.error("GHL sync failed (non-blocking):", err));

      setSubmitted(true);
    } catch (error) {
      console.error("Error sending inquiry:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border border-border-subtle rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {submitted ? (
          /* Success Screen */
          <div className="p-8 flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-green-500/10 p-4">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Message Sent</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Thank you for reaching out. A Shift representative will get back to you shortly.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              Done
            </button>
          </div>
        ) : (
        <>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="text-lg font-semibold text-foreground">Contact Us</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Have a question or need help sourcing a listing? Our concierge team will get back to you shortly.
          </p>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border-subtle rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
              placeholder="Tell us what you're looking for..."
              rows={3}
              required
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm"
          >
            {sending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Message
              </>
            )}
          </button>
        </form>
        </>
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

export default ContactModal;
