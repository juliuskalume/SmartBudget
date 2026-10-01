import Groq from "groq-sdk";
import { CATEGORY_VALUES, type AdviceCard, type FinancialSummary, type InvestmentHorizon, type MarketAssetSnapshot } from "../src/types.js";

const groqApiKey = process.env.GROQ_API_KEY?.trim();
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;
// Keep this configurable so a Groq model retirement can be handled by an
// environment change instead of silently dropping imported transactions.
const GROQ_MODEL = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";

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

function parseJsonObjectFromModel(value: string) {
  const directResult = safeParseJson(value);
  if (directResult && typeof directResult === "object") {
    return directResult;
  }

  // Some models wrap an otherwise valid JSON response in a Markdown code fence
  // when JSON mode is not available. Accept the object inside the response, but
  // leave validation to the caller before any value is used.
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  return start >= 0 && end > start ? safeParseJson(value.slice(start, end + 1)) : null;
}

type InvestmentSelection = {
  horizon: InvestmentHorizon;
  period: "1m" | "3m" | "1y";
  assetSymbol: string;
  rationale: string;
  confidence: "low" | "medium" | "high";
};

type InvestmentSelectionInput = {
  amount: number;
  summary: Pick<FinancialSummary, "healthScore" | "savingsRate" | "cashFlow" | "netWorth">;
  market: MarketAssetSnapshot[];
};

const INVESTMENT_SELECTION_MAX_TOKENS = 300;

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
    throw new Error("AI categorization is unavailable because GROQ_API_KEY is not configured.");
  }

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          `You are a financial assistant. Decide if a bank-related SMS or email is a real financial transaction alert or receipt. If it is, return isTransaction=true and extract merchant, amount, currency (prefer a 3-letter ISO 4217 code like TRY, USD, EUR, KES, NGN, UGX, GBP, INR when possible), category (${CATEGORY_VALUES.join(", ")}), and kind (expense for debit/spend/outflow, income for credit/inflow/refund). Use the most specific matching category and use Other only when none of the listed categories fit clearly. If it is not a transaction alert or receipt, return isTransaction=false. Return ONLY JSON.`,
      },
      {
        role: "user",
        content: smsText,
      },
    ],
    model: GROQ_MODEL,
    response_format: { type: "json_object" },
    max_tokens: 96,
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
      model: GROQ_MODEL,
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

export async function generateInvestmentSelections(input: InvestmentSelectionInput): Promise<InvestmentSelection[]> {
  if (!groq) {
    return [];
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a portfolio suggestion engine inside a budgeting app. Choose one asset for each horizon: weeks with period 1m, months with period 3m, years with period 1y. Use ONLY the supplied market symbols. Prefer strong momentum while considering financial stability. Market rows are [symbol, 1m return %, 3m return %, 6m return %, 1y return %, annualized volatility %]. Reply with one JSON object and no Markdown: {\"suggestions\":[{\"horizon\":\"weeks\",\"period\":\"1m\",\"assetSymbol\":\"SYMBOL\",\"rationale\":\"brief reason\",\"confidence\":\"medium\"}]}. Include exactly three suggestions, one for each horizon. Keep each rationale under 20 words.",
        },
        {
          role: "user",
          // Do not send display-only names, categories, and prices for the entire market
          // screen. Groq's TPM limit applies to both prompt and completion tokens.
          content: JSON.stringify({
            amount: roundForAi(input.amount),
            summary: {
              healthScore: roundForAi(input.summary.healthScore),
              savingsRate: roundForAi(input.summary.savingsRate),
              cashFlow: roundForAi(input.summary.cashFlow),
              netWorth: roundForAi(input.summary.netWorth),
            },
            market: input.market.map((asset) => [
              asset.symbol,
              roundForAi(asset.returns["1m"]),
              roundForAi(asset.returns["3m"]),
              roundForAi(asset.returns["6m"]),
              roundForAi(asset.returns["1y"]),
              roundForAi(asset.volatilityPct),
            ]),
          }),
        },
      ],
      model: GROQ_MODEL,
      // Do not enable Groq's legacy JSON mode here. Some configured models can
      // reject a valid What If request with `json_validate_failed` while trying
      // to validate their generated response. The validated parser below lets
      // the market screen safely fall back to deterministic rankings instead.
      max_tokens: INVESTMENT_SELECTION_MAX_TOKENS,
    });

    const result = parseJsonObjectFromModel(completion.choices[0].message.content || "{}");
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

function roundForAi(value: number) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
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
