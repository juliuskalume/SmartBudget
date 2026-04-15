import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateAdviceCards } from "../../server/ai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const data = req.body?.data ?? {};
    const result = await generateAdviceCards(data);
    res.status(200).json(result);
  } catch (error) {
    console.error("AI advice error:", error);
    res.status(500).json({ error: "AI advice failed" });
  }
}
