import type {
  AdviceCard,
  Category,
  CurrencyCode,
  FinancialSummary,
  Transaction,
  TransactionKind,
} from "../types";

export const CATEGORY_ORDER: Category[] = [
  "Supermarket",
  "Transport",
  "Entertainment",
  "Bills",
  "Education",
  "Other",
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Supermarket: "#54f1a3",
  Transport: "#7dd3fc",
  Entertainment: "#f0c36e",
  Bills: "#ff9f9f",
  Education: "#a78bfa",
  Other: "#94a3b8",
};

export const FX_RATES: Record<CurrencyCode, number> = {
  TRY: 1,
  USD: 32.5,
  EUR: 35.5,
};

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  TRY: "TL",
  USD: "USD",
  EUR: "EUR",
};

const SUPERMARKET_KEYWORDS = [
  "migros",
  "carrefour",
  "a101",
  "bim",
  "sok",
  "şok",
  "macrocenter",
  "market",
  "grocery",
  "supermarket",
];

const TRANSPORT_KEYWORDS = [
  "uber",
  "taxi",
  "taksi",
  "metro",
  "bus",
  "otobüs",
  "train",
  "tren",
  "petrol",
  "shell",
  "opet",
  "bp",
  "transport",
];

const ENTERTAINMENT_KEYWORDS = [
  "netflix",
  "spotify",
  "cinema",
  "sinema",
  "movie",
  "steam",
  "disney",
  "prime",
  "cafe",
  "restaurant",
  "yemek",
];

const BILLS_KEYWORDS = [
  "electricity",
  "elektrik",
  "water",
  "su",
  "internet",
  "telefon",
  "phone",
  "bill",
  "fatura",
  "gsm",
  "kredi kartı",
  "credit card",
  "loan",
  "installment",
];

const EDUCATION_KEYWORDS = [
  "school",
  "college",
  "university",
  "kurs",
  "course",
  "book",
  "kitap",
  "udemy",
  "coursera",
  "education",
  "eğitim",
];

function normalizeText(input: string) {
  return input
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function capitalizeWords(input: string) {
  return input
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function parseCurrencyToken(raw: string): CurrencyCode {
  const normalized = normalizeText(raw);
  if (normalized.includes("usd") || normalized.includes("$")) {
    return "USD";
  }
  if (normalized.includes("eur") || normalized.includes("€")) {
    return "EUR";
  }
  return "TRY";
}

function extractAmount(text: string) {
  const currencyPattern =
    /(?:(?:tl|try|₺|usd|\$|eur|€)\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(tl|try|₺|usd|\$|eur|€)?/i;
  const trailingPattern =
    /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(tl|try|₺|usd|\$|eur|€)/i;

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
    "yatırıldı",
    "yattı",
    "credited",
    "deposited",
    "transfer received",
    "refund",
    "iade",
    "girişi",
    "received",
  ];
  const expenseSignals = [
    "harcama",
    "spent",
    "payment",
    "ödem",
    "debit",
    "withdraw",
    "çekim",
    "spent at",
    "kartınızla",
    "card used",
    "purchase",
  ];

  if (incomeSignals.some((signal) => normalized.includes(signal))) {
    return "income";
  }

  if (expenseSignals.some((signal) => normalized.includes(signal))) {
    return "expense";
  }

  return "expense";
}

function detectCategory(merchant: string, text: string): Category {
  const normalized = normalizeText(`${merchant} ${text}`);
  const hasAny = (keywords: string[]) =>
    keywords.some((keyword) => normalized.includes(keyword));

  if (hasAny(SUPERMARKET_KEYWORDS)) {
    return "Supermarket";
  }

  if (hasAny(TRANSPORT_KEYWORDS)) {
    return "Transport";
  }

  if (hasAny(ENTERTAINMENT_KEYWORDS)) {
    return "Entertainment";
  }

  if (hasAny(BILLS_KEYWORDS)) {
    return "Bills";
  }

  if (hasAny(EDUCATION_KEYWORDS)) {
    return "Education";
  }

  return "Other";
}

function extractMerchant(text: string) {
  const normalized = text
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  const patterns = [
    /(?:at|from|via)\s+([A-Za-zÇĞİÖŞÜçğıöşü0-9&.'-]+(?:\s+[A-Za-zÇĞİÖŞÜçğıöşü0-9&.'-]+){0,3})/i,
    /([A-Za-zÇĞİÖŞÜçğıöşü0-9&.'-]+)(?:['’](?:ta|te|da|de))\b/i,
    /(?:merchant|store|place)\s+([A-Za-zÇĞİÖŞÜçğıöşü0-9&.'-]+(?:\s+[A-Za-zÇĞİÖŞÜçğıöşü0-9&.'-]+){0,3})/i,
    /(?:harcama|ödeme|payment|purchase)\s+(?:için\s+)?([A-Za-zÇĞİÖŞÜçğıöşü0-9&.'-]+(?:\s+[A-Za-zÇĞİÖŞÜçğıöşü0-9&.'-]+){0,3})/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return capitalizeWords(match[1].replace(/['’](?:ta|te|da|de)$/i, "").trim());
    }
  }

  const amountPattern =
    /(?:\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:tl|try|₺|usd|\$|eur|€)/i;
  const amountIndex = normalized.search(amountPattern);
  if (amountIndex > 0) {
    const beforeAmount = normalized.slice(0, amountIndex).trim();
    const words = beforeAmount.split(" ").filter(Boolean);
    const candidate = words.slice(-3).join(" ");
    if (candidate) {
      const cleaned = candidate.replace(
        /^(hesabınızdan|hesabinizdan|your card|your account|kartınızdan|kartinizdan|from|at|payment|purchase|harcama)$/i,
        "",
      );
      if (cleaned.trim()) {
        return capitalizeWords(cleaned.trim());
      }
    }
  }

  return "Unknown Merchant";
}

export function parseSmsTransaction(rawSms: string): Transaction | null {
  const text = rawSms.trim();
  if (!text) {
    return null;
  }

  const amount = extractAmount(text);
  if (!amount) {
    return null;
  }

  const merchant = extractMerchant(text);
  const kind = detectKind(text);
  const category = detectCategory(merchant, text);

  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    merchant,
    amount: amount.amount,
    currency: amount.currency,
    category,
    kind,
    source: "sms",
    rawSms: text,
  };
}

export function formatMoney(amount: number, currency: CurrencyCode = "TRY") {
  const rounded = Number.isInteger(amount)
    ? amount.toLocaleString("tr-TR", { maximumFractionDigits: 0 })
    : amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (currency === "TRY") {
    return `${rounded} TL`;
  }

  const symbol = currency === "USD" ? "$" : "€";
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
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

export function convertCurrency(amount: number, currency: CurrencyCode) {
  return amount / FX_RATES[currency];
}

export function normalizeCategory(category: string): Category {
  const target = category.trim().toLowerCase();
  if (target.includes("super") || target.includes("market")) {
    return "Supermarket";
  }
  if (target.includes("transport") || target.includes("taxi") || target.includes("ride")) {
    return "Transport";
  }
  if (target.includes("entertain") || target.includes("leisure") || target.includes("food")) {
    return "Entertainment";
  }
  if (target.includes("bill") || target.includes("debt") || target.includes("loan")) {
    return "Bills";
  }
  if (target.includes("educ") || target.includes("school") || target.includes("course")) {
    return "Education";
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

export function computeSummary(transactions: Transaction[]): FinancialSummary {
  const totalIncome = transactions
    .filter((transaction) => transaction.kind === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.kind === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.max(savings, 0) / totalIncome * 100 : 0;
  const expenseRatio = totalIncome > 0 ? totalExpenses / totalIncome * 100 : 0;
  const debtAmount = transactions
    .filter(
      (transaction) =>
        transaction.kind === "expense" &&
        /debt|loan|credit card|kredi kart|installment|taksit/i.test(transaction.merchant) ||
        transaction.category === "Bills" &&
        /debt|loan|credit card|kredi kart|installment|taksit/i.test(transaction.rawSms ?? transaction.merchant),
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const debtLevel = totalIncome > 0 ? debtAmount / totalIncome * 100 : 0;
  const netWorth = savings + Math.max(savings * 0.15, 0);
  const healthScore = clamp(
    50 + savingsRate * 0.65 - expenseRatio * 0.2 - debtLevel * 0.45 + (savings > 0 ? 6 : -8),
    0,
    100,
  );

  return {
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

export function buildCategoryBreakdown(transactions: Transaction[]) {
  const expenses = transactions.filter((transaction) => transaction.kind === "expense");
  const total = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);

  return CATEGORY_ORDER.map((category) => {
    const amount = expenses
      .filter((transaction) => transaction.category === category)
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      category,
      amount,
      share: total > 0 ? amount / total * 100 : 0,
      color: CATEGORY_COLORS[category],
    };
  }).filter((item) => item.amount > 0);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function buildMonthlyTrend(transactions: Transaction[], months = 6) {
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
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const expenses = bucket
      .filter((transaction) => transaction.kind === "expense")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      label: monthDate.toLocaleDateString("en-US", { month: "short" }),
      income,
      expenses,
      balance: income - expenses,
    };
  });
}

export function buildWeeklyTrend(transactions: Transaction[], weeks = 8) {
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
    const bucket = buckets.find(
      (entry) => txDate >= entry.start && txDate < entry.end,
    );
    if (bucket) {
      bucket.value += transaction.amount;
    }
  }

  return buckets.map((bucket) => ({
    label: bucket.label,
    value: bucket.value,
  }));
}

export function buildInsights(summary: FinancialSummary, transactions: Transaction[]) {
  const categoryBreakdown = buildCategoryBreakdown(transactions);
  const monthlyTrend = buildMonthlyTrend(transactions, 2);

  const insights: string[] = [];

  if (summary.savingsRate >= 20) {
    insights.push(`You are saving ${formatPercent(summary.savingsRate)} of income.`);
  } else {
    insights.push(`Savings are thin at ${formatPercent(summary.savingsRate)} of income.`);
  }

  const topCategory = categoryBreakdown[0];
  if (topCategory) {
    insights.push(
      `${topCategory.category} now makes up ${formatPercent(topCategory.share)} of tracked spending.`,
    );
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
    insights.push(`Cash flow is positive by ${formatMoney(summary.cashFlow)}.`);
  } else {
    insights.push(`You are overspending by ${formatMoney(Math.abs(summary.cashFlow))}.`);
  }

  return insights.slice(0, 3);
}

export function buildAdvice(summary: FinancialSummary, transactions: Transaction[]): AdviceCard[] {
  const categoryBreakdown = buildCategoryBreakdown(transactions);
  const topCategory = categoryBreakdown[0];
  const entertainment = categoryBreakdown.find((entry) => entry.category === "Entertainment");
  const supermarket = categoryBreakdown.find((entry) => entry.category === "Supermarket");

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
  } else if (supermarket && supermarket.share >= 30) {
    cards.push({
      type: "warning",
      title: "Groceries deserve a cap",
      description: `Supermarket purchases account for ${formatPercent(supermarket.share)}. Plan a fixed weekly basket before shopping.`,
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
      description: `You have ${formatMoney(summary.cashFlow)} of positive cash flow. Move part of it into Smart Save+ and convert it to a stable currency.`,
    });
  } else {
    cards.push({
      type: "error",
      title: "Close the gap before it grows",
      description: `Spending exceeded income by ${formatMoney(Math.abs(summary.cashFlow))}. Cut one bill or entertainment expense this week.`,
    });
  }

  const fillers: AdviceCard[] = [
    {
      type: "warning",
      title: "Keep SMS imports flowing",
      description: "The more bank SMS messages you import, the sharper your dashboard, alerts, and Smart Save+ projections become.",
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

export function projectSavings(startAmount: number, monthlyContribution: number, months = 12) {
  const start = Math.max(startAmount, 0);
  const contribution = Math.max(monthlyContribution, 0);

  return Array.from({ length: months }, (_, index) => {
    const monthsAhead = index + 1;
    const tryValue = start + contribution * monthsAhead;
    return {
      label: `${monthsAhead}M`,
      tryValue,
      usdValue: convertCurrency(tryValue, "USD"),
      eurValue: convertCurrency(tryValue, "EUR"),
    };
  });
}
