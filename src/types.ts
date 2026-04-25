export type CurrencyCode = string;
export type StableCurrencyCode = CurrencyCode;

export type Category =
  | "Supermarket"
  | "Transport"
  | "Entertainment"
  | "Bills"
  | "Education"
  | "Other";

export type TransactionKind = "income" | "expense";
export type TransactionSource = "sms" | "email" | "manual";

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
  source: TransactionSource;
  rawSms?: string;
  rawEmail?: string;
  emailSubject?: string;
  sourceMessageId?: string;
}

export interface ManualTransactionDraft {
  merchant: string;
  amount: number;
  currency: CurrencyCode;
  category: Category;
  kind: TransactionKind;
  date: string;
}

export interface EmailScannerConfig {
  emailAddress: string;
  host: string;
  port: number;
  mailbox: string;
  autoSyncEnabled: boolean;
  pollingIntervalMinutes: number;
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

export interface BalancePurchasingPowerShift {
  countryCode: string;
  countryName: string;
  latestMonth: string | null;
  inflationPct: number;
  purchasingPowerShiftPct: number;
  isIncrease: boolean;
  source: "worldbank-gem" | "bundled";
}

export interface ExchangeRateSnapshot {
  base: CurrencyCode;
  date: string | null;
  rates: Record<string, number>;
  source: "frankfurter" | "exchangerate-api" | "fallback";
}

export interface Bank {
  id: string;
  name: string;
  code: string;
  country: string;
  iban?: string;
  swift?: string;
  description?: string;
}

export interface ProtectedCurrencyHolding {
  id: string;
  currency: CurrencyCode;
  amount: number;
  bankId: string;
  purchaseDate: string;
  purchaseRate: number;
  purchaseAmount: number; // Amount in local currency used to buy this
}

export interface CurrencyTransaction {
  id: string;
  type: "buy" | "sell";
  currency: CurrencyCode;
  amount: number;
  bankId: string;
  exchangeRate: number;
  localAmount: number; // Amount in local currency
  date: string;
  description: string;
}

export interface SmartSavePlusState {
  protectedHoldings: ProtectedCurrencyHolding[];
  currencyTransactions: CurrencyTransaction[];
  totalProtectedValue: number;
}
