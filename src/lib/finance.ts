import { CATEGORY_VALUES, type AdviceCard, type Category, type CurrencyCode, type ExchangeRateSnapshot, type FinancialSummary, type Transaction, type TransactionSource, type TransactionKind } from "../types";
import { buildFallbackExchangeRates, normalizeCurrencyCode } from "./exchange-rates";

export const CATEGORY_ORDER: Category[] = [...CATEGORY_VALUES];

export const CATEGORY_COLORS: Record<Category, string> = {
  Groceries: "#93ff00",
  Dining: "#ff8a3d",
  Transport: "#2db7ff",
  Shopping: "#ff6b6b",
  "Bills & Utilities": "#fffd02",
  Housing: "#8b5cf6",
  Health: "#22c55e",
  Education: "#d8dde8",
  Entertainment: "#ff4fd8",
  "Cash & ATM": "#f97316",
  Transfers: "#38bdf8",
  Salary: "#34d399",
  Business: "#14b8a6",
  "Savings & Investment": "#facc15",
  Refunds: "#a78bfa",
  Other: "#94a3b8",
};

const GROCERIES_KEYWORDS = [
  "migros",
  "carrefour",
  "a101",
  "bim",
  "sok",
  "macrocenter",
  "aldi",
  "lidl",
  "walmart",
  "costco",
  "whole foods",
  "fresh market",
  "market",
  "grocery",
  "supermarket",
];

const DINING_KEYWORDS = [
  "restaurant",
  "cafe",
  "coffee",
  "starbucks",
  "mcdonald",
  "burger",
  "pizza",
  "kfc",
  "yemek",
  "food delivery",
  "yemeksepeti",
  "getir yemek",
  "uber eats",
  "doordash",
  "grubhub",
  "takeaway",
];

const TRANSPORT_KEYWORDS = [
  "uber",
  "lyft",
  "bolt",
  "taxi",
  "taksi",
  "metro",
  "bus",
  "otobus",
  "train",
  "tren",
  "tram",
  "subway",
  "flight",
  "airlines",
  "airport",
  "petrol",
  "fuel",
  "gas station",
  "shell",
  "opet",
  "bp",
  "transport",
];

const SHOPPING_KEYWORDS = [
  "amazon",
  "trendyol",
  "hepsiburada",
  "n11",
  "etsy",
  "ebay",
  "shopify",
  "store",
  "retail",
  "mall",
  "fashion",
  "clothing",
  "shoe",
  "cosmetic",
  "shopping",
];

const BILLS_KEYWORDS = [
  "electricity",
  "elektrik",
  "water",
  "su",
  "internet",
  "utility",
  "utilities",
  "telefon",
  "phone",
  "bill",
  "fatura",
  "gsm",
  "mobile",
  "broadband",
  "tv",
  "insurance",
  "kredi kart",
  "credit card",
  "loan",
  "installment",
  "subscription fee",
  "payment due",
];

const HOUSING_KEYWORDS = [
  "rent",
  "kira",
  "landlord",
  "lease",
  "mortgage",
  "apartment",
  "home rent",
  "site aidat",
  "housing",
  "property management",
];

const HEALTH_KEYWORDS = [
  "hospital",
  "clinic",
  "doctor",
  "pharmacy",
  "eczane",
  "medical",
  "medic",
  "dentist",
  "dental",
  "lab",
  "health",
  "wellness",
];

const EDUCATION_KEYWORDS = [
  "school",
  "college",
  "university",
  "tuition",
  "kurs",
  "course",
  "book",
  "kitap",
  "udemy",
  "coursera",
  "education",
  "egitim",
  "campus",
  "exam",
  "library",
];

const ENTERTAINMENT_KEYWORDS = [
  "netflix",
  "spotify",
  "cinema",
  "sinema",
  "movie",
  "steam",
  "disney",
  "prime video",
  "youtube premium",
  "playstation",
  "xbox",
  "game",
  "concert",
  "ticket",
  "theater",
];

const CASH_ATM_KEYWORDS = [
  "atm",
  "cash withdrawal",
  "cash withdraw",
  "cash out",
  "nakit",
  "cekim",
  "withdrawal",
  "para cekme",
];

const TRANSFER_KEYWORDS = [
  "transfer",
  "eft",
  "havale",
  "wire",
  "swift",
  "iban",
  "wise",
  "remit",
  "remittance",
  "western union",
  "money transfer",
];

const SALARY_KEYWORDS = [
  "salary",
  "payroll",
  "wage",
  "maas",
  "stipend",
  "scholarship",
  "bursary",
  "student finance",
  "salary payment",
];

const BUSINESS_KEYWORDS = [
  "invoice",
  "client",
  "freelance",
  "commission",
  "merchant payout",
  "settlement",
  "revenue",
  "sales proceeds",
  "stripe",
  "paypal",
  "payoneer",
  "upwork",
  "fiverr",
  "business",
];

const SAVINGS_INVESTMENT_KEYWORDS = [
  "savings",
  "interest",
  "dividend",
  "investment",
  "broker",
  "brokerage",
  "stock",
  "fund",
  "bond",
  "mutual",
  "deposit interest",
  "vadeli",
  "portfolio",
];

const REFUND_KEYWORDS = [
  "refund",
  "refunded",
  "reversal",
  "chargeback",
  "cashback",
  "cash back",
  "iade",
  "reimbursement",
];

const TRANSACTION_SIGNAL_KEYWORDS = [
  "account",
  "available balance",
  "bank",
  "card ending",
  "cash withdrawal",
  "charge",
  "charged",
  "credit alert",
  "credited",
  "debit alert",
  "debited",
  "deposit",
  "deposited",
  "direct deposit",
  "incoming transfer",
  "interest",
  "money received",
  "order total",
  "paid",
  "payment",
  "payment received",
  "posted",
  "purchase",
  "receipt",
  "refund",
  "statement credit",
  "transaction",
  "transfer",
  "salary",
  "payroll",
  "scholarship",
  "cashback",
  "withdrawal",
  "atm",
  "yatirildi",
  "harcama",
  "kart",
  "hesap",
];

const MARKETING_KEYWORDS = [
  "unsubscribe",
  "promo",
  "promotion",
  "coupon",
  "discount",
  "sale",
  "% off",
  "limited time",
  "shop now",
  "deal",
];

function normalizeText(input: string) {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

function sanitizeImportedMessage(input: string) {
  return input.replace(/\u00a0/g, " ").replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function capitalizeWords(input: string) {
  return input
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function looksLikeTransactionAlert(text: string) {
  const normalized = normalizeText(text);
  const hasSignal = TRANSACTION_SIGNAL_KEYWORDS.some((keyword) => normalized.includes(keyword));
  const hasAmountLike = /(?:\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:tl|try|usd|\$|eur|gbp|kes|ngn|ugx|inr|[a-z]{3})/i.test(
    text,
  );
  const looksLikePromo = MARKETING_KEYWORDS.some((keyword) => normalized.includes(keyword));

  if (!hasAmountLike || !hasSignal) {
    return false;
  }

  if (looksLikePromo && !/(?:receipt|charged|credited|debited|transaction|refund|payment|purchase|withdrawal|deposit)/i.test(normalized)) {
    return false;
  }

  return true;
}

function parseCurrencyToken(raw: string): CurrencyCode {
  const normalized = normalizeText(raw);
  if (normalized.includes("usd") || normalized.includes("$")) {
    return "USD";
  }
  if (normalized.includes("eur") || normalized.includes("euro") || normalized.includes("eur")) {
    return "EUR";
  }
  if (normalized.includes("try") || normalized.includes("tl") || normalized.includes("turkish lira")) {
    return "TRY";
  }

  const isoMatch = raw.trim().toUpperCase().match(/\b([A-Z]{3})\b/);
  return normalizeCurrencyCode(isoMatch?.[1], "TRY");
}

function extractAmount(text: string) {
  const currencyPattern =
    /(?:(?:tl|try|usd|\$|eur|[a-z]{3})\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(tl|try|usd|\$|eur|[a-z]{3})?/i;
  const trailingPattern =
    /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(tl|try|usd|\$|eur|[a-z]{3})/i;

  const matched = text.match(trailingPattern) ?? text.match(currencyPattern);
  if (!matched) {
    return null;
  }

  const amountText = matched[1];
  const currencyText = matched[2] ?? "TL";
  const cleaned = amountText.replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(/,(?=\d{3}(\D|$))/g, "");
  const normalized = cleaned.replace(/,/g, ".");
  const amount = Number.parseFloat(normalized);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return {
    amount,
    currency: parseCurrencyToken(currencyText),
  };
}

function detectKind(text: string): TransactionKind {
  const normalized = normalizeText(text);
  const incomeSignals = [
    "yatirildi",
    "yatti",
    "credited",
    "deposited",
    "transfer received",
    "incoming transfer",
    "refund",
    "iade",
    "girisi",
    "received",
    "payment received",
    "direct deposit",
    "statement credit",
    "salary",
    "payroll",
    "wage",
    "maas",
    "stipend",
    "scholarship",
    "interest",
    "dividend",
    "cashback",
    "reimbursement",
  ];
  const expenseSignals = [
    "harcama",
    "paid",
    "spent",
    "payment",
    "odem",
    "debit",
    "withdraw",
    "cekim",
    "spent at",
    "kartinizla",
    "card used",
    "purchase",
    "charged",
    "debited",
    "withdrawal",
    "cash withdrawal",
    "transfer sent",
    "outgoing transfer",
    "rent",
    "bill",
    "loan payment",
    "atm",
  ];

  if (incomeSignals.some((signal) => normalized.includes(signal))) {
    return "income";
  }

  if (expenseSignals.some((signal) => normalized.includes(signal))) {
    return "expense";
  }

  return "expense";
}

function detectCategory(merchant: string, text: string, kind: TransactionKind): Category {
  const normalized = normalizeText(`${merchant} ${text}`);
  const hasAny = (keywords: string[]) => keywords.some((keyword) => normalized.includes(keyword));

  if (kind === "income") {
    if (hasAny(REFUND_KEYWORDS)) {
      return "Refunds";
    }

    if (hasAny(SALARY_KEYWORDS)) {
      return "Salary";
    }

    if (hasAny(BUSINESS_KEYWORDS)) {
      return "Business";
    }

    if (hasAny(SAVINGS_INVESTMENT_KEYWORDS)) {
      return "Savings & Investment";
    }

    if (hasAny(TRANSFER_KEYWORDS)) {
      return "Transfers";
    }

    return "Other";
  }

  if (hasAny(CASH_ATM_KEYWORDS)) {
    return "Cash & ATM";
  }

  if (hasAny(SAVINGS_INVESTMENT_KEYWORDS)) {
    return "Savings & Investment";
  }

  if (hasAny(HOUSING_KEYWORDS)) {
    return "Housing";
  }

  if (hasAny(BILLS_KEYWORDS)) {
    return "Bills & Utilities";
  }

  if (hasAny(GROCERIES_KEYWORDS)) {
    return "Groceries";
  }

  if (hasAny(DINING_KEYWORDS)) {
    return "Dining";
  }

  if (hasAny(TRANSPORT_KEYWORDS)) {
    return "Transport";
  }

  if (hasAny(HEALTH_KEYWORDS)) {
    return "Health";
  }

  if (hasAny(EDUCATION_KEYWORDS)) {
    return "Education";
  }

  if (hasAny(ENTERTAINMENT_KEYWORDS)) {
    return "Entertainment";
  }

  if (hasAny(SHOPPING_KEYWORDS)) {
    return "Shopping";
  }

  if (hasAny(TRANSFER_KEYWORDS)) {
    return "Transfers";
  }

  return "Other";
}

function extractMerchant(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const patterns = [
    /(?:at|from|via)\s+([A-Za-z0-9&.'-]+(?:\s+[A-Za-z0-9&.'-]+){0,3})/i,
    /(?:merchant|store|place)\s+([A-Za-z0-9&.'-]+(?:\s+[A-Za-z0-9&.'-]+){0,3})/i,
    /(?:harcama|payment|purchase)\s+(?:icin\s+)?([A-Za-z0-9&.'-]+(?:\s+[A-Za-z0-9&.'-]+){0,3})/i,
    /(?:merchant|store|payee|vendor|description)\s*[:\-]\s*([A-Za-z0-9&.'/-]+(?:\s+[A-Za-z0-9&.'/-]+){0,4})/i,
    /(?:purchase|payment|receipt|charge(?:d)?|refund)\s+(?:at|from|to|for)?\s*([A-Za-z0-9&.'/-]+(?:\s+[A-Za-z0-9&.'/-]+){0,4})/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return capitalizeWords(match[1].trim());
    }
  }

  const amountPattern = /(?:\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:tl|try|usd|\$|eur|[a-z]{3})/i;
  const amountIndex = normalized.search(amountPattern);
  if (amountIndex > 0) {
    const beforeAmount = normalized.slice(0, amountIndex).trim();
    const words = beforeAmount.split(" ").filter(Boolean);
    const candidate = words.slice(-3).join(" ");
    if (candidate) {
      const cleaned = candidate.replace(/^(your card|your account|from|at|payment|purchase|harcama)$/i, "");
      if (cleaned.trim()) {
        return capitalizeWords(cleaned.trim());
      }
    }
  }

  return "Unknown Merchant";
}

export function parseBankMessageTransaction(rawMessage: string, source: Extract<TransactionSource, "sms" | "email"> = "sms"): Transaction | null {
  const text = sanitizeImportedMessage(rawMessage);
  if (!text) {
    return null;
  }

  if (!looksLikeTransactionAlert(text)) {
    return null;
  }

  const amount = extractAmount(text);
  if (!amount) {
    return null;
  }

  const merchant = extractMerchant(text);
  const kind = detectKind(text);
  const category = detectCategory(merchant, text, kind);

  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    merchant,
    amount: amount.amount,
    currency: amount.currency,
    category,
    kind,
    source,
    ...(source === "email" ? { rawEmail: text } : { rawSms: text }),
  };
}

export function parseSmsTransaction(rawSms: string): Transaction | null {
  return parseBankMessageTransaction(rawSms, "sms");
}

export function formatMoney(amount: number, currency: CurrencyCode = "TRY") {
  const normalizedCurrency = normalizeCurrencyCode(currency, "USD");
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const minimumFractionDigits = Number.isInteger(safeAmount) ? 0 : 2;
  const maximumFractionDigits = 2;

  if (normalizedCurrency === "TRY") {
    return `${safeAmount.toLocaleString("tr-TR", {
      minimumFractionDigits,
      maximumFractionDigits,
    })} TL`;
  }

  if (normalizedCurrency === "USD") {
    return `$${safeAmount.toLocaleString("en-US", {
      minimumFractionDigits,
      maximumFractionDigits,
    })}`;
  }

  if (normalizedCurrency === "EUR") {
    return `\u20ac${safeAmount.toLocaleString("en-US", {
      minimumFractionDigits,
      maximumFractionDigits,
    })}`;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalizedCurrency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(safeAmount);
  } catch {
    return `${safeAmount.toLocaleString("en-US", {
      minimumFractionDigits,
      maximumFractionDigits,
    })} ${normalizedCurrency}`;
  }
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function convertCurrency(
  amount: number,
  targetCurrency: CurrencyCode,
  baseCurrency: CurrencyCode = "TRY",
  exchangeRates?: ExchangeRateSnapshot | null,
) {
  return convertMoney(amount, baseCurrency, targetCurrency, exchangeRates);
}

export function convertMoney(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  exchangeRates?: ExchangeRateSnapshot | null,
) {
  const normalizedFrom = normalizeCurrencyCode(fromCurrency, "USD");
  const normalizedTo = normalizeCurrencyCode(toCurrency, "USD");

  if (!Number.isFinite(amount)) {
    return 0;
  }

  if (normalizedFrom === normalizedTo) {
    return amount;
  }

  const snapshot =
    exchangeRates?.base === normalizedTo
      ? exchangeRates
      : buildFallbackExchangeRates(normalizedTo, [normalizedFrom]);
  const directRate = snapshot.rates[normalizedFrom];

  if (Number.isFinite(directRate) && directRate > 0) {
    return amount / directRate;
  }

  const reverseSnapshot =
    exchangeRates?.base === normalizedFrom
      ? exchangeRates
      : buildFallbackExchangeRates(normalizedFrom, [normalizedTo]);
  const reverseRate = reverseSnapshot.rates[normalizedTo];

  if (Number.isFinite(reverseRate) && reverseRate > 0) {
    return amount * reverseRate;
  }

  return amount;
}

export function convertTransactionAmount(
  transaction: Pick<Transaction, "amount" | "currency">,
  displayCurrency: CurrencyCode,
  exchangeRates?: ExchangeRateSnapshot | null,
) {
  return convertMoney(transaction.amount, transaction.currency, displayCurrency, exchangeRates);
}

export function normalizeCategory(category: string): Category {
  const target = category.trim().toLowerCase();
  if (target.includes("grocery") || target.includes("supermarket") || target === "supermarket" || target.includes("market")) {
    return "Groceries";
  }

  if (target.includes("dining") || target.includes("restaurant") || target.includes("cafe") || target.includes("coffee") || target.includes("food")) {
    return "Dining";
  }

  if (target.includes("transport") || target.includes("taxi") || target.includes("ride") || target.includes("fuel")) {
    return "Transport";
  }

  if (target.includes("shop") || target.includes("retail") || target.includes("store") || target.includes("ecommerce")) {
    return "Shopping";
  }

  if (target.includes("bill") || target.includes("utility") || target.includes("debt") || target.includes("loan") || target.includes("credit card")) {
    return "Bills & Utilities";
  }

  if (target.includes("housing") || target.includes("rent") || target.includes("mortgage") || target.includes("home")) {
    return "Housing";
  }

  if (target.includes("health") || target.includes("medical") || target.includes("doctor") || target.includes("pharmacy")) {
    return "Health";
  }

  if (target.includes("educ") || target.includes("school") || target.includes("course") || target.includes("tuition")) {
    return "Education";
  }

  if (target.includes("entertain") || target.includes("leisure") || target.includes("stream") || target.includes("game")) {
    return "Entertainment";
  }

  if (target.includes("cash") || target.includes("atm") || target.includes("withdraw")) {
    return "Cash & ATM";
  }

  if (target.includes("transfer") || target.includes("wire") || target.includes("eft") || target.includes("remit")) {
    return "Transfers";
  }

  if (target.includes("salary") || target.includes("payroll") || target.includes("wage") || target.includes("scholarship") || target.includes("stipend")) {
    return "Salary";
  }

  if (target.includes("business") || target.includes("freelance") || target.includes("invoice") || target.includes("commission") || target.includes("payout")) {
    return "Business";
  }

  if (
    target.includes("saving") ||
    target.includes("investment") ||
    target.includes("interest") ||
    target.includes("dividend") ||
    target.includes("broker")
  ) {
    return "Savings & Investment";
  }

  if (target.includes("refund") || target.includes("cashback") || target.includes("reversal") || target.includes("reimbursement")) {
    return "Refunds";
  }

  return "Other";
}

export function normalizeAdviceType(type: string): AdviceCard["type"] {
  const target = type.trim().toLowerCase();
  if (target === "success" || target === "warning" || target === "error") {
    return target;
  }
  return "warning";
}

export function computeSummary(
  transactions: Transaction[],
  displayCurrency: CurrencyCode = "TRY",
  exchangeRates?: ExchangeRateSnapshot | null,
): FinancialSummary {
  const normalizedCurrency = normalizeCurrencyCode(displayCurrency, "TRY");
  const totalIncome = transactions
    .filter((transaction) => transaction.kind === "income")
    .reduce((sum, transaction) => sum + convertTransactionAmount(transaction, normalizedCurrency, exchangeRates), 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.kind === "expense")
    .reduce((sum, transaction) => sum + convertTransactionAmount(transaction, normalizedCurrency, exchangeRates), 0);

  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (Math.max(savings, 0) / totalIncome) * 100 : 0;
  const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  const debtAmount = transactions
    .filter(
      (transaction) =>
        (transaction.kind === "expense" && /debt|loan|credit card|kredi kart|installment|taksit/i.test(transaction.merchant)) ||
        (
          transaction.category === "Bills & Utilities" &&
          /debt|loan|credit card|kredi kart|installment|taksit/i.test(transaction.rawSms ?? transaction.merchant)
        ),
    )
    .reduce((sum, transaction) => sum + convertTransactionAmount(transaction, normalizedCurrency, exchangeRates), 0);

  const debtLevel = totalIncome > 0 ? (debtAmount / totalIncome) * 100 : 0;
  const netWorth = savings + Math.max(savings * 0.15, 0);
  const healthScore = clamp(50 + savingsRate * 0.65 - expenseRatio * 0.2 - debtLevel * 0.45 + (savings > 0 ? 6 : -8), 0, 100);

  return {
    currency: normalizedCurrency,
    totalIncome,
    totalExpenses,
    savings,
    savingsRate,
    expenseRatio,
    debtLevel,
    cashFlow: totalIncome - totalExpenses,
    netWorth,
    healthScore,
  };
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function buildCategoryBreakdown(
  transactions: Transaction[],
  displayCurrency: CurrencyCode = "TRY",
  exchangeRates?: ExchangeRateSnapshot | null,
) {
  const normalizedCurrency = normalizeCurrencyCode(displayCurrency, "TRY");
  const expenses = transactions.filter((transaction) => transaction.kind === "expense");
  const total = expenses.reduce((sum, transaction) => sum + convertTransactionAmount(transaction, normalizedCurrency, exchangeRates), 0);

  return CATEGORY_ORDER.map((category) => {
    const amount = expenses
      .filter((transaction) => transaction.category === category)
      .reduce((sum, transaction) => sum + convertTransactionAmount(transaction, normalizedCurrency, exchangeRates), 0);

    return {
      category,
      amount,
      share: total > 0 ? (amount / total) * 100 : 0,
      color: CATEGORY_COLORS[category],
    };
  }).filter((item) => item.amount > 0);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function buildMonthlyTrend(
  transactions: Transaction[],
  months = 6,
  displayCurrency: CurrencyCode = "TRY",
  exchangeRates?: ExchangeRateSnapshot | null,
) {
  const normalizedCurrency = normalizeCurrencyCode(displayCurrency, "TRY");
  const now = new Date();
  const labels = Array.from({ length: months }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);
    return monthDate;
  });

  return labels.map((monthDate) => {
    const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
    const bucket = transactions.filter((transaction) => {
      const txDate = new Date(transaction.date);
      const txKey = `${txDate.getFullYear()}-${txDate.getMonth()}`;
      return txKey === monthKey;
    });

    const income = bucket
      .filter((transaction) => transaction.kind === "income")
      .reduce((sum, transaction) => sum + convertTransactionAmount(transaction, normalizedCurrency, exchangeRates), 0);
    const expenses = bucket
      .filter((transaction) => transaction.kind === "expense")
      .reduce((sum, transaction) => sum + convertTransactionAmount(transaction, normalizedCurrency, exchangeRates), 0);

    return {
      label: monthDate.toLocaleDateString("en-US", { month: "short" }),
      income,
      expenses,
      balance: income - expenses,
    };
  });
}

export function buildWeeklyTrend(
  transactions: Transaction[],
  weeks = 8,
  displayCurrency: CurrencyCode = "TRY",
  exchangeRates?: ExchangeRateSnapshot | null,
) {
  const normalizedCurrency = normalizeCurrencyCode(displayCurrency, "TRY");
  const now = new Date();
  const start = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  start.setDate(start.getDate() - (weeks - 1) * 7);
  start.setHours(0, 0, 0, 0);

  const buckets = Array.from({ length: weeks }, (_, index) => {
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + index * 7);
    return {
      label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      start: weekStart,
      end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
      value: 0,
    };
  });

  for (const transaction of transactions) {
    if (transaction.kind !== "expense") {
      continue;
    }

    const txDate = new Date(transaction.date);
    const bucket = buckets.find((entry) => txDate >= entry.start && txDate < entry.end);
    if (bucket) {
      bucket.value += convertTransactionAmount(transaction, normalizedCurrency, exchangeRates);
    }
  }

  return buckets.map((bucket) => ({
    label: bucket.label,
    value: bucket.value,
  }));
}

export function buildInsights(summary: FinancialSummary, transactions: Transaction[], exchangeRates?: ExchangeRateSnapshot | null) {
  if (transactions.length === 0) {
    return [
      "Import your first bank message or receipt to start the ledger.",
      "Category trends appear after SmartBudget saves real spending data.",
      "Use Smart Save+ after income and expenses are tracked.",
    ];
  }

  const categoryBreakdown = buildCategoryBreakdown(transactions, summary.currency, exchangeRates);
  const monthlyTrend = buildMonthlyTrend(transactions, 2, summary.currency, exchangeRates);

  const insights: string[] = [];

  if (summary.savingsRate >= 20) {
    insights.push(`You are saving ${formatPercent(summary.savingsRate)} of income.`);
  } else {
    insights.push(`Savings are thin at ${formatPercent(summary.savingsRate)} of income.`);
  }

  const topCategory = categoryBreakdown[0];
  if (topCategory) {
    insights.push(`${topCategory.category} now makes up ${formatPercent(topCategory.share)} of tracked spending.`);
  }

  if (monthlyTrend.length >= 2) {
    const previous = monthlyTrend[monthlyTrend.length - 2];
    const latest = monthlyTrend[monthlyTrend.length - 1];
    if (previous.expenses > 0) {
      const delta = ((latest.expenses - previous.expenses) / previous.expenses) * 100;
      if (delta > 0) {
        insights.push(`Monthly spending is up ${formatPercent(delta)} versus the previous month.`);
      } else {
        insights.push(`Monthly spending is down ${formatPercent(Math.abs(delta))} versus the previous month.`);
      }
    }
  }

  if (summary.cashFlow >= 0) {
    insights.push(`Cash flow is positive by ${formatMoney(summary.cashFlow, summary.currency)}.`);
  } else {
    insights.push(`You are overspending by ${formatMoney(Math.abs(summary.cashFlow), summary.currency)}.`);
  }

  return insights.slice(0, 3);
}

export function buildAdvice(summary: FinancialSummary, transactions: Transaction[], exchangeRates?: ExchangeRateSnapshot | null): AdviceCard[] {
  if (transactions.length === 0) {
    return [
      {
        type: "warning",
        title: "Import the first transaction",
        description: "Enable Android SMS sync or add a manual debit or credit so SmartBudget can build your ledger.",
      },
      {
        type: "warning",
        title: "Track one income source",
        description: "Add scholarship, salary, or transfer entries so savings rate and cash flow become meaningful.",
      },
      {
        type: "success",
        title: "Cloud sync is ready",
        description: "Your account starts empty. Only transactions you import or save will appear here.",
      },
    ];
  }

  const categoryBreakdown = buildCategoryBreakdown(transactions, summary.currency, exchangeRates);
  const topCategory = categoryBreakdown[0];
  const entertainment = categoryBreakdown.find((entry) => entry.category === "Entertainment");
  const groceries = categoryBreakdown.find((entry) => entry.category === "Groceries");
  const dining = categoryBreakdown.find((entry) => entry.category === "Dining");

  const cards: AdviceCard[] = [];

  if (summary.savingsRate >= 20) {
    cards.push({
      type: "success",
      title: "Savings habit looks healthy",
      description: `You are keeping ${formatPercent(summary.savingsRate)} of income. Move part of that into Smart Save+ to protect its value.`,
    });
  } else {
    cards.push({
      type: "warning",
      title: "Build a larger savings buffer",
      description: `Savings sit at ${formatPercent(summary.savingsRate)}. Aim for at least 20% next month by trimming one recurring expense.`,
    });
  }

  if (entertainment && entertainment.share >= 20) {
    cards.push({
      type: "error",
      title: "Entertainment is eating budget",
      description: `Entertainment uses ${formatPercent(entertainment.share)} of spending. Cap it with a weekly limit inside your app.`,
    });
  } else if (dining && dining.share >= 18) {
    cards.push({
      type: "warning",
      title: "Dining spend is creeping up",
      description: `Dining takes ${formatPercent(dining.share)} of spending. Set a weekly food-out budget before it drifts further.`,
    });
  } else if (groceries && groceries.share >= 30) {
    cards.push({
      type: "warning",
      title: "Groceries deserve a cap",
      description: `Groceries account for ${formatPercent(groceries.share)} of spending. Plan a fixed weekly basket before shopping.`,
    });
  } else if (topCategory) {
    cards.push({
      type: "success",
      title: `${topCategory.category} looks controlled`,
      description: `${topCategory.category} is your largest bucket, but it stays under the danger threshold.`,
    });
  }

  if (summary.cashFlow >= 0) {
    cards.push({
      type: "success",
      title: "Protect this month's surplus",
      description: `You have ${formatMoney(summary.cashFlow, summary.currency)} of positive cash flow. Move part of it into Smart Save+ and convert it to a stable currency.`,
    });
  } else {
    cards.push({
      type: "error",
      title: "Close the gap before it grows",
      description: `Spending exceeded income by ${formatMoney(Math.abs(summary.cashFlow), summary.currency)}. Cut one bill, dining, or entertainment expense this week.`,
    });
  }

  const fillers: AdviceCard[] = [
    {
      type: "warning",
      title: "Keep imports flowing",
      description: "The more bank SMS messages and email alerts you import, the sharper your dashboard, alerts, and Smart Save+ projections become.",
    },
    {
      type: "success",
      title: "Use the dashboard weekly",
      description: "A quick weekly check on savings rate and category shifts is enough to catch the bad habits early.",
    },
  ];

  while (cards.length < 3) {
    cards.push(fillers[cards.length - 1] ?? fillers[0]);
  }

  return cards.slice(0, 3);
}

export function projectSavings(
  startAmount: number,
  monthlyContribution: number,
  months = 12,
  baseCurrency: CurrencyCode = "TRY",
  exchangeRates?: ExchangeRateSnapshot | null,
) {
  const normalizedCurrency = normalizeCurrencyCode(baseCurrency, "TRY");
  const start = Math.max(startAmount, 0);
  const contribution = Math.max(monthlyContribution, 0);

  return Array.from({ length: months }, (_, index) => {
    const monthsAhead = index + 1;
    const baseValue = start + contribution * monthsAhead;
    return {
      label: `${monthsAhead}M`,
      baseValue,
      baseCurrency: normalizedCurrency,
      usdValue: convertMoney(baseValue, normalizedCurrency, "USD", exchangeRates),
      eurValue: convertMoney(baseValue, normalizedCurrency, "EUR", exchangeRates),
    };
  });
}
