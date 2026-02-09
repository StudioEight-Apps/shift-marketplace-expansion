import type { VercelRequest, VercelResponse } from "@vercel/node";

// ── GoHighLevel API v2 ──────────────────────────────────────────────────
const GHL_API_KEY = process.env.GHL_API_KEY!;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID!;
const GHL_BASE = "https://services.leadconnectorhq.com";

interface GHLContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  locationId: string;
  tags: string[];
  customFields?: { id: string; value: string }[];
  source?: string;
}

// ── Handler ──────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    console.error("Missing GHL_API_KEY or GHL_LOCATION_ID env vars");
    return res.status(500).json({ error: "GHL not configured" });
  }

  try {
    const {
      guestName,
      guestEmail,
      guestPhone,
      assetType,
      assetName,
      checkIn,
      checkOut,
      guests,
      hours,
      guestNotes,
      bookingId,
    } = req.body;

    // Split name into first/last
    const nameParts = (guestName || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Build tags
    const tags = ["Shift Website", `Booking: ${assetType || "unknown"}`];
    if (assetName) tags.push(assetName);

    // Build notes for the contact
    const noteLines = [
      `Booking ID: ${bookingId || "N/A"}`,
      `Asset: ${assetName || "N/A"} (${assetType || "N/A"})`,
      checkIn ? `Check-in: ${checkIn}` : null,
      checkOut ? `Check-out: ${checkOut}` : null,
      hours ? `Hours: ${hours}` : null,
      guests ? `Guests: ${guests}` : null,
      guestNotes ? `Notes: ${guestNotes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    // 1. Search for existing contact by email
    const searchRes = await fetch(
      `${GHL_BASE}/contacts/v1/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(guestEmail)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          Version: "2021-07-28",
          Accept: "application/json",
        },
      }
    );

    let contactId: string | null = null;

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      contactId = searchData?.contact?.id || null;
    }

    if (contactId) {
      // 2a. Update existing contact — append tags, update notes
      const updateRes = await fetch(`${GHL_BASE}/contacts/${contactId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: guestPhone,
          tags,
          source: "Shift Website",
        }),
      });

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        console.error("GHL update failed:", updateRes.status, errText);
        return res.status(502).json({ error: "Failed to update GHL contact", details: errText });
      }

      console.log("Updated GHL contact:", contactId);
    } else {
      // 2b. Create new contact
      const payload: GHLContactPayload = {
        firstName,
        lastName,
        email: guestEmail,
        phone: guestPhone,
        locationId: GHL_LOCATION_ID,
        tags,
        source: "Shift Website",
      };

      const createRes = await fetch(`${GHL_BASE}/contacts/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        console.error("GHL create failed:", createRes.status, errText);
        return res.status(502).json({ error: "Failed to create GHL contact", details: errText });
      }

      const createData = await createRes.json();
      contactId = createData?.contact?.id;
      console.log("Created GHL contact:", contactId);
    }

    // 3. Add a note to the contact with booking details
    if (contactId) {
      await fetch(`${GHL_BASE}/contacts/${contactId}/notes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ body: noteLines }),
      });
    }

    return res.status(200).json({ success: true, contactId });
  } catch (err: any) {
    console.error("GHL sync error:", err);
    return res.status(500).json({ error: err.message || "Internal error" });
  }
}
