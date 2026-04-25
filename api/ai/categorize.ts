import type { VercelRequest, VercelResponse } from "@vercel/node";
import { categorizeSmsText } from "../../server/ai.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const messageText =
      typeof req.body?.messageText === "string"
        ? req.body.messageText
        : typeof req.body?.smsText === "string"
          ? req.body.smsText
          : "";
    const result = await categorizeSmsText(messageText);
    res.status(200).json(result);
  } catch (error) {
    console.error("AI categorize error:", error);
    res.status(500).json({ error: "AI processing failed" });
  }
}
