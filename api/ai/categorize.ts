import type { VercelRequest, VercelResponse } from "@vercel/node";
import { categorizeSmsText } from "../../server/ai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const smsText = typeof req.body?.smsText === "string" ? req.body.smsText : "";
    const result = await categorizeSmsText(smsText);
    res.status(200).json(result);
  } catch (error) {
    console.error("AI categorize error:", error);
    res.status(500).json({ error: "AI processing failed" });
  }
}
