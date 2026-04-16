export type CurrencyCode = "TRY" | "USD" | "EUR";

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
  | "advice";

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

export interface FinancialSummary {
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
