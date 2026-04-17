export type CurrencyCode = string;
export type StableCurrencyCode = "USD" | "EUR";

export type Category =
  | "Supermarket"
  | "Transport"
  | "Entertainment"
  | "Bills"
  | "Education"
  | "Other";

export type TransactionKind = "income" | "expense";

export type ScreenKey =
  | "dashboard"
  | "transactions"
  | "analysis"
  | "save"
  | "advice"
  | "profile";

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  currency: CurrencyCode;
  category: Category;
  kind: TransactionKind;
  source: "sms" | "manual";
  rawSms?: string;
}

export interface ManualTransactionDraft {
  merchant: string;
  amount: number;
  currency: CurrencyCode;
  category: Category;
  kind: TransactionKind;
  date: string;
}

export interface AdviceCard {
  type: "success" | "warning" | "error";
  title: string;
  description: string;
}

export type WhatIfPeriod = "1m" | "3m" | "6m" | "1y";

export interface WhatIfAssetPerformance {
  symbol: string;
  name: string;
  category: string;
  currency: string;
  startDate: string;
  endDate: string;
  startPrice: number;
  endPrice: number;
  returnPct: number;
  investedAmount: number;
  currentValue: number;
  gain: number;
}

export interface WhatIfScenario {
  period: WhatIfPeriod;
  periodLabel: string;
  amount: number;
  startDate: string;
  endDate: string;
  bestAsset: WhatIfAssetPerformance;
  assets: WhatIfAssetPerformance[];
  disclaimer: string;
}

export type InvestmentHorizon = "weeks" | "months" | "years";

export interface MarketAssetSnapshot {
  symbol: string;
  name: string;
  category: string;
  currency: string;
  currentPrice: number;
  volatilityPct: number;
  returns: Record<WhatIfPeriod, number>;
}

export interface InvestmentSuggestion {
  horizon: InvestmentHorizon;
  horizonLabel: string;
  period: WhatIfPeriod;
  periodLabel: string;
  asset: MarketAssetSnapshot;
  investedAmount: number;
  estimatedReturnPct: number;
  estimatedValue: number;
  estimatedGain: number;
  rationale: string;
  basis: string;
  confidence: "low" | "medium" | "high";
}

export interface InvestmentRecommendations {
  amount: number;
  generatedAt: string;
  source: "ai" | "deterministic";
  suggestions: InvestmentSuggestion[];
  market: MarketAssetSnapshot[];
  disclaimer: string;
}

export interface MarketInsights {
  generatedAt: string;
  provider: "yahoo" | "twelve";
  market: MarketAssetSnapshot[];
  recommendations: InvestmentRecommendations;
  whatIfByPeriod: Record<WhatIfPeriod, WhatIfScenario>;
  disclaimer: string;
}

export interface FinancialSummary {
  currency: CurrencyCode;
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  savingsRate: number;
  expenseRatio: number;
  debtLevel: number;
  cashFlow: number;
  netWorth: number;
  healthScore: number;
}

export interface ExchangeRateSnapshot {
  base: CurrencyCode;
  date: string | null;
  rates: Record<string, number>;
  source: "frankfurter" | "fallback";
}
