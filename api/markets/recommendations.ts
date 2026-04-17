import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildInvestmentRecommendations } from "../../server/markets.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const summary = req.body?.summary ?? {};
    const result = await buildInvestmentRecommendations({
      amount: Number(req.body?.amount),
      summary: {
        healthScore: Number(summary.healthScore) || 0,
        savingsRate: Number(summary.savingsRate) || 0,
        cashFlow: Number(summary.cashFlow) || 0,
        netWorth: Number(summary.netWorth) || 0,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Market recommendations API error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Unable to build investment suggestions" });
  }
}
