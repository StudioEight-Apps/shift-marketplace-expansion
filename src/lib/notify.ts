// Fire-and-forget email notification helper
// Calls /api/notify to send email to shiftrentalssf@gmail.com

const getBaseUrl = () =>
  window.location.hostname === "localhost"
    ? ""
    : "https://adoring-ptolemy.vercel.app";

export async function notifyBooking(data: {
  customer: { name: string; email: string; phone: string; uid: string };
  villa: any;
  car: any;
  yacht: any;
  grandTotal: number;
  requestId: string;
}) {
  try {
    await fetch(`${getBaseUrl()}/api/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "booking", data }),
    });
  } catch (err) {
    console.error("Email notification failed (non-blocking):", err);
  }
}

export async function notifyContact(data: {
  name: string;
  email: string;
  phone: string;
  message: string;
}) {
  try {
    await fetch(`${getBaseUrl()}/api/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "contact", data }),
    });
  } catch (err) {
    console.error("Email notification failed (non-blocking):", err);
  }
}

export async function notifyListWithUs(data: {
  name: string;
  email: string;
  phone: string;
  market: string;
  listingType: string;
  details: Record<string, unknown>;
  notes: string;
  photoCount: number;
}) {
  try {
    await fetch(`${getBaseUrl()}/api/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "listWithUs", data }),
    });
  } catch (err) {
    console.error("Email notification failed (non-blocking):", err);
  }
}
