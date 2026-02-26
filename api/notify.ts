import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

// Gmail SMTP — uses the owner's own Gmail account. No third-party service.
// Env vars needed:
//   GMAIL_USER     = shiftrentalssf@gmail.com
//   GMAIL_APP_PASS = 16-char App Password from Google Account → Security → App Passwords
const GMAIL_USER = process.env.GMAIL_USER!;
const GMAIL_APP_PASS = process.env.GMAIL_APP_PASS!;
const NOTIFY_EMAIL = process.env.GMAIL_USER || "shiftrentalssf@gmail.com";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!GMAIL_USER || !GMAIL_APP_PASS) {
    console.error("Missing GMAIL_USER or GMAIL_APP_PASS env vars");
    return res.status(500).json({ error: "Email not configured" });
  }

  try {
    const { type, data } = req.body;

    if (!type || !data) {
      return res.status(400).json({ error: "Missing type or data" });
    }

    const { subject, html } = buildEmail(type, data);

    // Create Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASS,
      },
    });

    const result = await transporter.sendMail({
      from: `Shift Rentals <${GMAIL_USER}>`,
      to: NOTIFY_EMAIL,
      subject,
      html,
    });

    console.log("Email sent:", result.messageId);
    return res.status(200).json({ success: true, messageId: result.messageId });
  } catch (err: any) {
    console.error("Email send error:", err);
    return res.status(500).json({ error: err.message || "Internal error" });
  }
}

// ── Email builders ──────────────────────────────────────────────────────

function buildEmail(type: string, data: any): { subject: string; html: string } {
  switch (type) {
    case "booking":
      return buildBookingEmail(data);
    case "contact":
      return buildContactEmail(data);
    case "listWithUs":
      return buildListWithUsEmail(data);
    default:
      return {
        subject: `[Shift] New ${type} Submission`,
        html: `<pre>${JSON.stringify(data, null, 2)}</pre>`,
      };
  }
}

function buildBookingEmail(data: any): { subject: string; html: string } {
  const { customer, villa, car, yacht, grandTotal, requestId } = data;

  // Build items list
  const items: string[] = [];
  if (villa) {
    items.push(`
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">
          <strong>🏠 Stay:</strong> ${villa.name}<br/>
          <span style="color:#666;font-size:13px;">${villa.location} · ${villa.nights} night${villa.nights !== 1 ? "s" : ""} · $${Number(villa.price).toLocaleString()}</span>
        </td>
      </tr>
    `);
  }
  if (car) {
    items.push(`
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">
          <strong>🚗 Car:</strong> ${car.name}<br/>
          <span style="color:#666;font-size:13px;">${car.days} day${car.days !== 1 ? "s" : ""} · $${Number(car.price).toLocaleString()}</span>
        </td>
      </tr>
    `);
  }
  if (yacht) {
    items.push(`
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">
          <strong>⛵ Yacht:</strong> ${yacht.name}<br/>
          <span style="color:#666;font-size:13px;">${yacht.hours} hour${yacht.hours !== 1 ? "s" : ""} · ${yacht.startTime}–${yacht.endTime} · $${Number(yacht.price).toLocaleString()}</span>
        </td>
      </tr>
    `);
  }

  const isGuest = customer.uid === "guest";
  const customerLabel = isGuest ? "Guest Request" : "Registered User";

  const subject = `[Shift] New Booking Request — $${Number(grandTotal).toLocaleString()}`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 4px;color:#111;">New Booking Request</h2>
      <p style="margin:0 0 20px;color:#888;font-size:13px;">${customerLabel} · Request ID: ${requestId || "N/A"}</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <tr style="background:#f9f9f9;">
          <td style="padding:12px;border-radius:8px;">
            <strong style="font-size:15px;">${customer.name || "Unknown"}</strong><br/>
            <span style="color:#666;font-size:13px;">
              ${customer.email || "No email"}${customer.phone ? ` · ${customer.phone}` : ""}
            </span>
          </td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        ${items.join("")}
      </table>

      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:12px;background:#111;color:#fff;border-radius:8px;text-align:center;">
            <strong style="font-size:18px;">Total: $${Number(grandTotal).toLocaleString()}</strong>
          </td>
        </tr>
      </table>

      <p style="margin:20px 0 0;text-align:center;">
        <a href="https://admin-panel-self-psi.vercel.app/requests" style="display:inline-block;padding:10px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">
          View in Admin Panel
        </a>
      </p>
    </div>
  `;

  return { subject, html };
}

function buildContactEmail(data: any): { subject: string; html: string } {
  const { name, email, phone, message } = data;

  const subject = `[Shift] New Contact Inquiry from ${name}`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 16px;color:#111;">New Contact Inquiry</h2>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <tr style="background:#f9f9f9;">
          <td style="padding:12px;border-radius:8px;">
            <strong style="font-size:15px;">${name}</strong><br/>
            <span style="color:#666;font-size:13px;">
              ${email}${phone ? ` · ${phone}` : ""}
            </span>
          </td>
        </tr>
      </table>

      <div style="padding:16px;background:#f9f9f9;border-radius:8px;margin-bottom:16px;">
        <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
        <p style="margin:0;color:#333;font-size:14px;line-height:1.5;">${message}</p>
      </div>

      <p style="margin:0;text-align:center;">
        <a href="mailto:${email}" style="display:inline-block;padding:10px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">
          Reply to ${name.split(" ")[0]}
        </a>
      </p>
    </div>
  `;

  return { subject, html };
}

function buildListWithUsEmail(data: any): { subject: string; html: string } {
  const { name, email, phone, market, listingType, details, notes, photoCount } = data;

  // Build details rows
  const detailRows: string[] = [];
  if (details) {
    if (details.address) detailRows.push(`<strong>Address:</strong> ${details.address}`);
    if (details.bedrooms) detailRows.push(`<strong>Bedrooms:</strong> ${details.bedrooms}`);
    if (details.bathrooms) detailRows.push(`<strong>Bathrooms:</strong> ${details.bathrooms}`);
    if (details.alreadyListed) detailRows.push(`<strong>Already on Airbnb/VRBO:</strong> Yes`);
    if (details.carDescription) detailRows.push(`<strong>Vehicle:</strong> ${details.carDescription}`);
    if (details.carYear) detailRows.push(`<strong>Year:</strong> ${details.carYear}`);
    if (details.yachtName) detailRows.push(`<strong>Yacht Name:</strong> ${details.yachtName}`);
    if (details.yachtLength) detailRows.push(`<strong>Length:</strong> ${details.yachtLength} ft`);
    if (details.captainIncluded !== undefined) detailRows.push(`<strong>Captain:</strong> ${details.captainIncluded ? "Included" : "Not included"}`);
  }

  const subject = `[Shift] New ${listingType} Listing Inquiry — ${market}`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 4px;color:#111;">New Listing Inquiry</h2>
      <p style="margin:0 0 20px;color:#888;font-size:13px;">${listingType} · ${market}</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <tr style="background:#f9f9f9;">
          <td style="padding:12px;border-radius:8px;">
            <strong style="font-size:15px;">${name}</strong><br/>
            <span style="color:#666;font-size:13px;">
              ${email}${phone ? ` · ${phone}` : ""}
            </span>
          </td>
        </tr>
      </table>

      ${detailRows.length > 0 ? `
        <div style="padding:16px;background:#f9f9f9;border-radius:8px;margin-bottom:16px;">
          <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">${listingType} Details</p>
          ${detailRows.map((r) => `<p style="margin:0 0 4px;color:#333;font-size:14px;">${r}</p>`).join("")}
        </div>
      ` : ""}

      ${notes ? `
        <div style="padding:16px;background:#f9f9f9;border-radius:8px;margin-bottom:16px;">
          <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Notes</p>
          <p style="margin:0;color:#333;font-size:14px;line-height:1.5;">${notes}</p>
        </div>
      ` : ""}

      ${photoCount ? `<p style="color:#666;font-size:13px;">📷 ${photoCount} photo${photoCount !== 1 ? "s" : ""} uploaded</p>` : ""}

      <p style="margin:16px 0 0;text-align:center;">
        <a href="mailto:${email}" style="display:inline-block;padding:10px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">
          Reply to ${name.split(" ")[0]}
        </a>
      </p>
    </div>
  `;

  return { subject, html };
}
