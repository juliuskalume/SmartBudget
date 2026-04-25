import Groq from "groq-sdk";
import type { AdviceCard, FinancialSummary, InvestmentHorizon, MarketAssetSnapshot } from "../src/types.js";

const groqApiKey = process.env.GROQ_API_KEY?.trim();
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

const categorizeFallback = {
  isTransaction: false,
  merchant: "Unknown",
  amount: 0,
  category: "Other",
  kind: "expense",
  currency: "USD",
};

function safeParseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

type InvestmentSelection = {
  horizon: InvestmentHorizon;
  period: "1m" | "3m" | "1y";
  assetSymbol: string;
  rationale: string;
  confidence: "low" | "medium" | "high";
};

function normalizeCurrency(value: unknown, fallback = categorizeFallback.currency) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toUpperCase();
  if (!normalized) {
    return fallback;
  }

  if (normalized === "TL" || normalized === "₺") {
    return "TRY";
  }

  if (normalized === "$") {
    return "USD";
  }

  if (normalized === "€") {
    return "EUR";
  }

  return /^[A-Z]{3}$/.test(normalized) ? normalized : fallback;
}

export async function categorizeSmsText(smsText: string) {
  if (!groq) {
    return categorizeFallback;
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a financial assistant. Decide if a bank-related SMS or email is a real financial transaction alert or receipt. If it is, return isTransaction=true and extract merchant, amount, currency (prefer a 3-letter ISO 4217 code like TRY, USD, EUR, KES, NGN, UGX, GBP, INR when possible), category (Supermarket, Transport, Entertainment, Bills, Education, Other), and kind (expense for debit/spend/outflow, income for credit/inflow/refund). If it is not a transaction alert or receipt, return isTransaction=false. Return ONLY JSON.",
        },
        {
          role: "user",
          content: smsText,
        },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const result = safeParseJson(completion.choices[0].message.content || "{}");
    return {
      isTransaction: typeof result?.isTransaction === "boolean" ? result.isTransaction : categorizeFallback.isTransaction,
      merchant: typeof result?.merchant === "string" ? result.merchant : categorizeFallback.merchant,
      amount: Number.isFinite(Number(result?.amount)) ? Number(result.amount) : categorizeFallback.amount,
      category: typeof result?.category === "string" ? result.category : categorizeFallback.category,
      kind: result?.kind === "income" || result?.kind === "expense" ? result.kind : categorizeFallback.kind,
      currency: normalizeCurrency(result?.currency),
    };
  } catch {
    return categorizeFallback;
  }
}

export async function generateAdviceCards(data: unknown): Promise<AdviceCard[]> {
  if (!groq) {
    return [];
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Based on financial data, provide 3 personalized advice cards. Each card must have: type (success, warning, error), title, and description. Return ONLY a JSON array of objects.",
        },
        {
          role: "user",
          content: JSON.stringify(data),
        },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const result = safeParseJson(completion.choices[0].message.content || "{}");
    const adviceArray = Array.isArray(result) ? result : result?.advice || result?.recommendations || [];

    return Array.isArray(adviceArray)
      ? adviceArray
          .filter((card): card is AdviceCard => {
            return Boolean(card) && typeof card === "object" && typeof card.title === "string" && typeof card.description === "string";
          })
          .slice(0, 3)
      : [];
  } catch {
    return [];
  }
}

export async function generateInvestmentSelections(input: {
  amount: number;
  summary: Pick<FinancialSummary, "healthScore" | "savingsRate" | "cashFlow" | "netWorth">;
  market: MarketAssetSnapshot[];
}): Promise<InvestmentSelection[]> {
  if (!groq) {
    return [];
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a portfolio suggestion engine inside a budgeting app. Choose one asset for each horizon: weeks with period 1m, months with period 3m, years with period 1y. Use ONLY the supplied market symbols. Prefer assets with strong recent momentum, but keep the user's financial stability in mind. Return ONLY JSON with a suggestions array. Each suggestion must include horizon, period, assetSymbol, rationale, confidence (low, medium, high).",
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const result = safeParseJson(completion.choices[0].message.content || "{}");
    const suggestions = Array.isArray(result) ? result : result?.suggestions || result?.recommendations || [];

    return Array.isArray(suggestions)
      ? suggestions
          .map((entry) => sanitizeInvestmentSelection(entry, input.market))
          .filter((entry): entry is InvestmentSelection => entry !== null)
      : [];
  } catch {
    return [];
  }
}

function sanitizeInvestmentSelection(value: unknown, market: MarketAssetSnapshot[]): InvestmentSelection | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const horizon = candidate.horizon;
  const period = candidate.period;
  const assetSymbol = typeof candidate.assetSymbol === "string" ? candidate.assetSymbol.trim().toUpperCase() : "";
  const rationale = typeof candidate.rationale === "string" ? candidate.rationale.trim() : "";
  const confidence = candidate.confidence;

  if (horizon !== "weeks" && horizon !== "months" && horizon !== "years") {
    return null;
  }

  if (period !== "1m" && period !== "3m" && period !== "1y") {
    return null;
  }

  if (!assetSymbol || !market.some((asset) => asset.symbol.toUpperCase() === assetSymbol)) {
    return null;
  }

  return {
    horizon,
    period,
    assetSymbol,
    rationale: rationale || "Momentum and current market structure make this the strongest candidate in the tracked universe.",
    confidence: confidence === "low" || confidence === "medium" || confidence === "high" ? confidence : "medium",
  };
}
