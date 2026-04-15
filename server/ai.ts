import Groq from "groq-sdk";
import type { AdviceCard } from "../src/types";

const groqApiKey = process.env.GROQ_API_KEY?.trim();
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

const categorizeFallback = {
  merchant: "Unknown",
  amount: 0,
  category: "Other",
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
            "You are a financial assistant. Extract transaction details (merchant, amount, category) from SMS. Categories: Supermarket, Transport, Entertainment, Bills, Education, Other. Return ONLY JSON.",
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
      merchant: typeof result?.merchant === "string" ? result.merchant : categorizeFallback.merchant,
      amount: Number.isFinite(Number(result?.amount)) ? Number(result.amount) : categorizeFallback.amount,
      category: typeof result?.category === "string" ? result.category : categorizeFallback.category,
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
