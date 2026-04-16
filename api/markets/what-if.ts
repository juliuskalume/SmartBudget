import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildWhatIfScenario } from "../../server/markets";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const period = typeof req.query.period === "string" ? req.query.period : "3m";
  const amount = Number(req.query.amount);

  try {
    const result = await buildWhatIfScenario(period as "1m" | "3m" | "6m" | "1y", amount);
    res.status(200).json(result);
  } catch (error) {
    console.error("What-if API error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Unable to build market scenario" });
  }
}
