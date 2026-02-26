import type { VercelRequest, VercelResponse } from "@vercel/node";

// Firebase Storage REST API upload
// Uploads a file to Firebase Storage using the public REST API (no admin SDK needed)
const BUCKET = "shiftrentals-38d07.firebasestorage.app";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fileName, contentType, data } = req.body;

    if (!fileName || !data) {
      return res.status(400).json({ error: "Missing fileName or data" });
    }

    // data is base64-encoded file content
    const buffer = Buffer.from(data, "base64");
    const encodedPath = encodeURIComponent(fileName);

    // Upload to Firebase Storage via REST API
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o?uploadType=media&name=${encodedPath}`;

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": contentType || "application/octet-stream",
      },
      body: buffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("Firebase Storage upload failed:", uploadRes.status, errText);
      return res.status(500).json({ error: "Upload failed", details: errText });
    }

    const uploadData = await uploadRes.json();

    // Build the download URL with the token
    const token = uploadData.downloadTokens;
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodedPath}?alt=media&token=${token}`;

    return res.status(200).json({ url: downloadUrl });
  } catch (error: any) {
    console.error("Upload handler error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
