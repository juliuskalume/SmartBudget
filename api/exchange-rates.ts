import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const base = typeof req.query.base === "string" ? req.query.base : "USD";
    const quotesParam = typeof req.query.quotes === "string" ? req.query.quotes : "";

    const apiKey = process.env.EXCHANGERATE_API_KEY?.trim();
    if (!apiKey) {
      res.status(500).json({ error: "Exchange Rate API key is not configured." });
      return;
    }

    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Exchange Rate API request failed (${response.status}).`);
    }

    const payload = await response.json();
    const rates =
      typeof payload?.conversion_rates === "object" && payload.conversion_rates
        ? payload.conversion_rates
        : {};

    res.status(200).json({
      base,
      rates: Object.fromEntries(Object.entries(rates).filter(([_, value]) => typeof value === "number")),
      source: "exchangerate-api",
    });
  } catch (error) {
    console.error("Exchange rates error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Unable to fetch exchange rates" });
  }
}
