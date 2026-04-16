import Groq from "groq-sdk";
import type { AdviceCard } from "../src/types";

const groqApiKey = process.env.GROQ_API_KEY?.trim();
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

const categorizeFallback = {
  isTransaction: false,
  merchant: "Unknown",
  amount: 0,
  category: "Other",
  kind: "expense",
  currency: "TRY",
};

function safeParseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
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
            "You are a financial assistant. Decide if an SMS is a real financial transaction alert. If it is, return isTransaction=true and extract merchant, amount, currency (TRY, USD, EUR), category (Supermarket, Transport, Entertainment, Bills, Education, Other), and kind (expense for debit/spend/outflow, income for credit/inflow/refund). If it is not a transaction alert, return isTransaction=false. Return ONLY JSON.",
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
      currency:
        result?.currency === "USD" || result?.currency === "EUR" || result?.currency === "TRY"
          ? result.currency
          : categorizeFallback.currency,
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
