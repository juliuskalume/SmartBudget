import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildBalancePurchasingPowerShift } from "../../server/inflation.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const countryCode = typeof req.query.country === "string" ? req.query.country : "";
    const result = await buildBalancePurchasingPowerShift(countryCode);

    if (!result) {
      res.status(404).json({ error: "Inflation data is unavailable for this country." });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Inflation API error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Unable to load inflation data." });
  }
}
