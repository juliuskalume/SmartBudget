import { generateInvestmentSelections } from "./ai.js";
import type {
  FinancialSummary,
  InvestmentRecommendations,
  InvestmentSuggestion,
  MarketAssetSnapshot,
  WhatIfAssetPerformance,
  WhatIfPeriod,
  WhatIfScenario,
} from "../src/types";

const YAHOO_BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
const TWELVE_DATA_BASE_URL = "https://api.twelvedata.com";
const twelveDataApiKey = process.env.TWELVE_DATA_API_KEY?.trim();

const PERIOD_CONFIG: Record<WhatIfPeriod, { range: string; label: string; days: number }> = {
  "1m": { range: "1mo", label: "1 month", days: 30 },
  "3m": { range: "3mo", label: "3 months", days: 90 },
  "6m": { range: "6mo", label: "6 months", days: 180 },
  "1y": { range: "1y", label: "1 year", days: 365 },
};

const RECOMMENDATION_HORIZONS = [
  { horizon: "weeks", horizonLabel: "Next 4 weeks", period: "1m" },
  { horizon: "months", horizonLabel: "Next 3 months", period: "3m" },
  { horizon: "years", horizonLabel: "Next 1 year", period: "1y" },
] as const;

const PLAN_SAFE_TWELVE_ASSETS = [
  { symbol: "AAPL", name: "Apple", category: "Large Cap Equity" },
  { symbol: "MSFT", name: "Microsoft", category: "Large Cap Equity" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", category: "ETF" },
  { symbol: "QQQ", name: "Invesco QQQ", category: "ETF" },
  { symbol: "BTC/USD", name: "Bitcoin", category: "Crypto" },
  { symbol: "ETH/USD", name: "Ethereum", category: "Crypto" },
  { symbol: "AGG", name: "iShares Core U.S. Aggregate Bond ETF", category: "Bond ETF" },
  { symbol: "FXAIX", name: "Fidelity 500 Index Fund", category: "Mutual Fund" },
] as const;

const LEGACY_TRACKED_ASSETS = [
  { symbol: "BTC-USD", name: "Bitcoin", category: "Crypto" },
  { symbol: "ETH-USD", name: "Ethereum", category: "Crypto" },
  { symbol: "SOL-USD", name: "Solana", category: "Crypto" },
  { symbol: "QQQ", name: "Invesco QQQ", category: "Equity ETF" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", category: "Equity ETF" },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", category: "Equity ETF" },
  { symbol: "NVDA", name: "NVIDIA", category: "Growth Equity" },
  { symbol: "MSFT", name: "Microsoft", category: "Large Cap Equity" },
  { symbol: "GLD", name: "SPDR Gold Shares", category: "Commodity ETF" },
] as const;

type TwelveAssetDefinition = {
  provider: "twelve";
  symbol: string;
  name: string;
  category: string;
};

type LegacyAssetDefinition = {
  provider: "legacy";
  symbol: string;
  name: string;
  category: string;
};

type AssetDefinition = TwelveAssetDefinition | LegacyAssetDefinition;

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        currency?: string;
      };
      timestamp?: number[];
      indicators?: {
        adjclose?: Array<{ adjclose?: Array<number | null> }>;
        quote?: Array<{ close?: Array<number | null> }>;
      };
    }>;
  };
};

type PricePoint = {
  price: number;
  timestamp: number;
};

type AssetSeries = {
  symbol: string;
  name: string;
  category: string;
  currency: string;
  points: PricePoint[];
};

type GenericRecord = Record<string, unknown>;

let priceSeriesCache: { expiresAt: number; seriesBySymbol: Map<string, AssetSeries>; provider: "twelve" | "legacy" } | null = null;

export async function buildWhatIfScenario(period: WhatIfPeriod, amount: number): Promise<WhatIfScenario> {
  const normalizedAmount = Number(amount);
  const config = PERIOD_CONFIG[period];

  if (!config) {
    throw new Error("Unsupported lookback period.");
  }

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error("Simulation amount must be greater than zero.");
  }

  const { provider, seriesBySymbol } = await loadPlanSafeSeries();
  const assets = buildWhatIfPerformanceForPeriod(seriesBySymbol, period, normalizedAmount);

  if (assets.length === 0) {
    throw new Error("Market data is unavailable right now.");
  }

  const bestAsset = assets[0];

  return {
    period,
    periodLabel: config.label,
    amount: normalizedAmount,
    startDate: bestAsset.startDate,
    endDate: bestAsset.endDate,
    bestAsset,
    assets,
    disclaimer:
      provider === "twelve"
        ? "This compares the strongest performer in SmartBudget's plan-safe live market screen. Taxes, fees, and FX slippage are excluded."
        : "This compares a fallback market basket and excludes taxes, fees, and FX slippage.",
  };
}

export async function buildInvestmentRecommendations(input: {
  amount: number;
  summary: Pick<FinancialSummary, "healthScore" | "savingsRate" | "cashFlow" | "netWorth">;
}): Promise<InvestmentRecommendations> {
  const normalizedAmount = Number(input.amount);

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error("A positive investable balance is required for asset suggestions.");
  }

  const { provider, seriesBySymbol } = await loadPlanSafeSeries();
  const market = buildMarketSnapshots(seriesBySymbol);

  if (market.length === 0) {
    throw new Error("Live market suggestions are unavailable right now.");
  }

  const aiSelections = await generateInvestmentSelections({
    amount: normalizedAmount,
    summary: input.summary,
    market,
  });

  const suggestions = buildRecommendationSuggestions({
    amount: normalizedAmount,
    market,
    summary: input.summary,
    aiSelections,
  });

  return {
    amount: normalizedAmount,
    generatedAt: new Date().toISOString(),
    source: aiSelections.length > 0 ? "ai" : "deterministic",
    suggestions,
    market,
    disclaimer:
      provider === "twelve"
        ? "These are scenario estimates based on SmartBudget's plan-safe Twelve Data screen across equities, ETFs, crypto, bonds, and funds. They are not guaranteed returns and do not include taxes, fees, or slippage."
        : "These are scenario estimates based on a fallback market screen. They are not guaranteed returns and do not include taxes, fees, or slippage.",
  };
}

export async function buildMarketInsights(input: {
  amount: number;
  summary: Pick<FinancialSummary, "healthScore" | "savingsRate" | "cashFlow" | "netWorth">;
}) {
  const { provider, seriesBySymbol } = await loadPlanSafeSeries();
  const market = buildMarketSnapshots(seriesBySymbol);

  if (market.length === 0) {
    throw new Error("Live market suggestions are unavailable right now.");
  }

  const amount = Number.isFinite(input.amount) && input.amount > 0 ? input.amount : 100;
  const aiSelections = await generateInvestmentSelections({
    amount,
    summary: input.summary,
    market,
  });

  const suggestions = buildRecommendationSuggestions({
    amount,
    market,
    summary: input.summary,
    aiSelections,
  });

  const whatIfByPeriod = {
    "1m": buildScenarioTemplate(seriesBySymbol, "1m"),
    "3m": buildScenarioTemplate(seriesBySymbol, "3m"),
    "6m": buildScenarioTemplate(seriesBySymbol, "6m"),
    "1y": buildScenarioTemplate(seriesBySymbol, "1y"),
  };

  return {
    generatedAt: new Date().toISOString(),
    provider,
    market,
    recommendations: {
      amount,
      generatedAt: new Date().toISOString(),
      source: aiSelections.length > 0 ? "ai" : "deterministic",
      suggestions,
      market,
      disclaimer:
        provider === "twelve"
          ? "These are scenario estimates based on SmartBudget's plan-safe Twelve Data screen across equities, ETFs, crypto, bonds, and funds. They are not guaranteed returns and do not include taxes, fees, or slippage."
          : "These are scenario estimates based on a fallback market screen. They are not guaranteed returns and do not include taxes, fees, or slippage.",
    },
    whatIfByPeriod,
    disclaimer:
      provider === "twelve"
        ? "SmartBudget is using a plan-safe Twelve Data screen that fits the current API credit budget."
        : "SmartBudget is using a fallback market screen because live provider data is not available right now.",
  };
}

async function loadPlanSafeSeries(): Promise<{ provider: "twelve" | "legacy"; seriesBySymbol: Map<string, AssetSeries> }> {
  if (priceSeriesCache && priceSeriesCache.expiresAt > Date.now()) {
    return {
      provider: priceSeriesCache.provider,
      seriesBySymbol: priceSeriesCache.seriesBySymbol,
    };
  }

  if (twelveDataApiKey) {
    try {
      const seriesBySymbol = await fetchTwelveBatchSeries();

      if (seriesBySymbol.size > 0) {
        priceSeriesCache = {
          expiresAt: Date.now() + 15 * 60 * 1000,
          seriesBySymbol,
          provider: "twelve",
        };
        return {
          provider: "twelve",
          seriesBySymbol,
        };
      }
    } catch {
      // Fall back to the legacy universe below.
    }
  }

  const seriesBySymbol = await fetchLegacySeries();
  priceSeriesCache = {
    expiresAt: Date.now() + 15 * 60 * 1000,
    seriesBySymbol,
    provider: "legacy",
  };

  return {
    provider: "legacy",
    seriesBySymbol,
  };
}

async function fetchTwelveBatchSeries() {
  const payload = await fetchTwelveJson("/time_series", {
    symbol: PLAN_SAFE_TWELVE_ASSETS.map((asset) => asset.symbol).join(","),
    interval: "1day",
    outputsize: "390",
  });

  const result = new Map<string, AssetSeries>();

  for (const asset of PLAN_SAFE_TWELVE_ASSETS) {
    const entry = isRecord(payload[asset.symbol]) ? (payload[asset.symbol] as GenericRecord) : null;

    if (!entry) {
      continue;
    }

    if (readString(entry, ["status"])?.toLowerCase() === "error") {
      continue;
    }

    const meta = isRecord(entry.meta) ? entry.meta : {};
    const points = extractTwelvePricePoints(entry);

    if (points.length < 2) {
      continue;
    }

    result.set(asset.symbol, {
      symbol: asset.symbol,
      name: asset.name,
      category: asset.category,
      currency: readString(meta, ["currency"]) || "USD",
      points,
    });
  }

  return result;
}

async function fetchLegacySeries() {
  const settled = await Promise.allSettled(
    LEGACY_TRACKED_ASSETS.map((asset) =>
      fetchYahooAssetSeries({
        provider: "legacy",
        ...asset,
      }),
    ),
  );

  const result = new Map<string, AssetSeries>();

  for (const entry of settled) {
    if (entry.status === "fulfilled") {
      result.set(entry.value.symbol, entry.value);
    }
  }

  return result;
}

async function fetchYahooAssetSeries(asset: LegacyAssetDefinition): Promise<AssetSeries> {
  const response = await fetch(`${YAHOO_BASE_URL}/${encodeURIComponent(asset.symbol)}?range=1y&interval=1d`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SmartBudget/1.0; +https://smartbudget.app)",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Market request failed for ${asset.symbol}.`);
  }

  const payload = (await response.json()) as YahooChartResponse;
  const result = payload.chart?.result?.[0];
  const timestamps = Array.isArray(result?.timestamp) ? result.timestamp : [];
  const adjClose = result?.indicators?.adjclose?.[0]?.adjclose;
  const close = result?.indicators?.quote?.[0]?.close;
  const prices = Array.isArray(adjClose) && adjClose.length > 0 ? adjClose : close;
  const points = buildPricePoints(prices, timestamps);

  if (!result || points.length < 2) {
    throw new Error(`No market history returned for ${asset.symbol}.`);
  }

  return {
    symbol: asset.symbol,
    name: asset.name,
    category: asset.category,
    currency: result.meta?.currency?.trim() || "USD",
    points,
  };
}

function buildMarketSnapshots(seriesBySymbol: Map<string, AssetSeries>) {
  return [...seriesBySymbol.values()]
    .map((series) => {
      const latest = series.points[series.points.length - 1];

      return {
        symbol: series.symbol,
        name: series.name,
        category: series.category,
        currency: series.currency,
        currentPrice: latest.price,
        volatilityPct: computeAnnualizedVolatilityPct(series.points),
        returns: {
          "1m": computeReturnPctForPeriod(series.points, "1m"),
          "3m": computeReturnPctForPeriod(series.points, "3m"),
          "6m": computeReturnPctForPeriod(series.points, "6m"),
          "1y": computeReturnPctForPeriod(series.points, "1y"),
        },
      } satisfies MarketAssetSnapshot;
    })
    .sort((left, right) => right.returns["3m"] - left.returns["3m"]);
}

function buildWhatIfPerformanceForPeriod(seriesBySymbol: Map<string, AssetSeries>, period: WhatIfPeriod, amount: number) {
  return [...seriesBySymbol.values()]
    .map((series) => buildWhatIfAssetPerformance(series, period, amount))
    .sort((left, right) => right.returnPct - left.returnPct);
}

function buildScenarioTemplate(seriesBySymbol: Map<string, AssetSeries>, period: WhatIfPeriod): WhatIfScenario {
  const amount = 1;
  const assets = buildWhatIfPerformanceForPeriod(seriesBySymbol, period, amount);
  const bestAsset = assets[0];

  if (!bestAsset) {
    throw new Error("Market data is unavailable right now.");
  }

  return {
    period,
    periodLabel: PERIOD_CONFIG[period].label,
    amount,
    startDate: bestAsset.startDate,
    endDate: bestAsset.endDate,
    bestAsset,
    assets,
    disclaimer: "Scale the scenario amount locally without spending another provider call.",
  };
}

function buildWhatIfAssetPerformance(series: AssetSeries, period: WhatIfPeriod, amount: number): WhatIfAssetPerformance {
  const startPoint = findLookbackPoint(series.points, period);
  const endPoint = series.points[series.points.length - 1];

  if (!startPoint || !endPoint || startPoint.price <= 0 || endPoint.price <= 0) {
    throw new Error(`Incomplete market history for ${series.symbol}.`);
  }

  const currentValue = (amount / startPoint.price) * endPoint.price;
  const gain = currentValue - amount;

  return {
    symbol: series.symbol,
    name: series.name,
    category: series.category,
    currency: series.currency,
    startDate: new Date(startPoint.timestamp * 1000).toISOString(),
    endDate: new Date(endPoint.timestamp * 1000).toISOString(),
    startPrice: startPoint.price,
    endPrice: endPoint.price,
    returnPct: amount > 0 ? (gain / amount) * 100 : 0,
    investedAmount: amount,
    currentValue,
    gain,
  };
}

function buildRecommendationSuggestions(input: {
  amount: number;
  market: MarketAssetSnapshot[];
  summary: Pick<FinancialSummary, "healthScore" | "savingsRate" | "cashFlow" | "netWorth">;
  aiSelections: Array<{
    horizon: "weeks" | "months" | "years";
    period: "1m" | "3m" | "1y";
    assetSymbol: string;
    rationale: string;
    confidence: "low" | "medium" | "high";
  }>;
}): InvestmentSuggestion[] {
  return RECOMMENDATION_HORIZONS.map((config) => {
    const aiSelection = input.aiSelections.find((entry) => entry.horizon === config.horizon && entry.period === config.period);
    const asset =
      (aiSelection ? input.market.find((entry) => entry.symbol.toUpperCase() === aiSelection.assetSymbol.toUpperCase()) : null) ??
      pickFallbackAsset(input.market, config.period, input.summary);

    return createInvestmentSuggestion({
      amount: input.amount,
      asset,
      horizon: config.horizon,
      horizonLabel: config.horizonLabel,
      period: config.period,
      rationale: aiSelection?.rationale ?? buildFallbackRationale(asset, config.period, input.summary),
      confidence: aiSelection?.confidence ?? deriveConfidence(asset, config.period),
    });
  });
}

function createInvestmentSuggestion(input: {
  amount: number;
  asset: MarketAssetSnapshot;
  horizon: "weeks" | "months" | "years";
  horizonLabel: string;
  period: "1m" | "3m" | "1y";
  rationale: string;
  confidence: "low" | "medium" | "high";
}): InvestmentSuggestion {
  const estimatedReturnPct = input.asset.returns[input.period];
  const estimatedValue = input.amount * (1 + estimatedReturnPct / 100);
  const estimatedGain = estimatedValue - input.amount;

  return {
    horizon: input.horizon,
    horizonLabel: input.horizonLabel,
    period: input.period,
    periodLabel: PERIOD_CONFIG[input.period].label,
    asset: input.asset,
    investedAmount: input.amount,
    estimatedReturnPct,
    estimatedValue,
    estimatedGain,
    rationale: input.rationale,
    basis: `Scenario if the last ${PERIOD_CONFIG[input.period].label} trend repeated once more.`,
    confidence: input.confidence,
  };
}

function pickFallbackAsset(
  market: MarketAssetSnapshot[],
  period: "1m" | "3m" | "1y",
  summary: Pick<FinancialSummary, "healthScore" | "savingsRate" | "cashFlow" | "netWorth">,
) {
  return [...market].sort((left, right) => scoreAsset(right, period, summary) - scoreAsset(left, period, summary))[0];
}

function scoreAsset(
  asset: MarketAssetSnapshot,
  period: "1m" | "3m" | "1y",
  summary: Pick<FinancialSummary, "healthScore" | "savingsRate" | "cashFlow" | "netWorth">,
) {
  const riskPenaltyMultiplier =
    summary.cashFlow < 0 || summary.healthScore < 45
      ? 0.95
      : summary.healthScore < 65 || summary.savingsRate < 15
        ? 0.65
        : 0.35;

  const trendSupport = period === "1m" ? asset.returns["3m"] * 0.25 : period === "3m" ? asset.returns["6m"] * 0.3 : asset.returns["1y"] * 0.25;
  const volatilityPenalty =
    asset.volatilityPct * riskPenaltyMultiplier * (period === "1m" ? 0.9 : period === "3m" ? 0.55 : 0.22);

  return asset.returns[period] + trendSupport - volatilityPenalty;
}

function buildFallbackRationale(
  asset: MarketAssetSnapshot,
  period: "1m" | "3m" | "1y",
  summary: Pick<FinancialSummary, "healthScore" | "savingsRate" | "cashFlow" | "netWorth">,
) {
  const stability =
    summary.cashFlow < 0 || summary.healthScore < 45
      ? "It balances upside with a tighter volatility profile for your current finances."
      : "Its momentum is the strongest after adjusting for volatility in SmartBudget's plan-safe live market screen.";

  return `${asset.name} leads our ${PERIOD_CONFIG[period].label} screen. ${stability}`;
}

function deriveConfidence(asset: MarketAssetSnapshot, period: "1m" | "3m" | "1y"): "low" | "medium" | "high" {
  const returnPct = asset.returns[period];

  if (returnPct >= 18 && asset.volatilityPct <= 35) {
    return "high";
  }

  if (returnPct >= 4) {
    return "medium";
  }

  return "low";
}

function computeReturnPctForPeriod(points: PricePoint[], period: WhatIfPeriod) {
  const startPoint = findLookbackPoint(points, period);
  const endPoint = points[points.length - 1];

  if (!startPoint || !endPoint || startPoint.price <= 0 || endPoint.price <= 0) {
    throw new Error("Incomplete market history.");
  }

  return ((endPoint.price - startPoint.price) / startPoint.price) * 100;
}

function findLookbackPoint(points: PricePoint[], period: WhatIfPeriod) {
  const lookbackSeconds = PERIOD_CONFIG[period].days * 24 * 60 * 60;
  const endPoint = points[points.length - 1];
  const targetTimestamp = endPoint.timestamp - lookbackSeconds;
  const candidate = points.find((point) => point.timestamp >= targetTimestamp);

  return candidate ?? points[0];
}

function buildPricePoints(prices: Array<number | null> | undefined, timestamps: number[]) {
  if (!Array.isArray(prices) || prices.length === 0) {
    return [];
  }

  return prices
    .map((price, index) => ({
      price: Number(price),
      timestamp: Number(timestamps[index]),
    }))
    .filter((entry) => Number.isFinite(entry.price) && entry.price > 0 && Number.isFinite(entry.timestamp));
}

function extractTwelvePricePoints(payload: GenericRecord) {
  const values = Array.isArray(payload.values) ? payload.values.filter(isRecord) : [];

  return values
    .map((entry) => ({
      price: readNumber(entry, ["close", "price", "value"]),
      timestamp: parseDateToTimestamp(readString(entry, ["datetime", "date", "timestamp"])),
    }))
    .filter((entry): entry is PricePoint => Number.isFinite(entry.price) && entry.price > 0 && Number.isFinite(entry.timestamp))
    .sort((left, right) => left.timestamp - right.timestamp);
}

function parseDateToTimestamp(value: string | null) {
  if (!value) {
    return Number.NaN;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.floor(timestamp / 1000) : Number.NaN;
}

function computeAnnualizedVolatilityPct(points: PricePoint[]) {
  if (points.length < 3) {
    return 0;
  }

  const dailyReturns = points
    .slice(1)
    .map((point, index) => {
      const previous = points[index];
      return previous.price > 0 ? (point.price - previous.price) / previous.price : null;
    })
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (dailyReturns.length < 2) {
    return 0;
  }

  const mean = dailyReturns.reduce((sum, value) => sum + value, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (dailyReturns.length - 1);

  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

async function fetchTwelveJson(pathname: string, params: Record<string, string>) {
  if (!twelveDataApiKey) {
    throw new Error("TWELVE_DATA_API_KEY is not configured.");
  }

  const url = new URL(pathname, TWELVE_DATA_BASE_URL);
  url.search = new URLSearchParams({
    ...params,
    apikey: twelveDataApiKey,
    format: "JSON",
  }).toString();

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; SmartBudget/1.0; +https://smartbudget.app)",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Twelve Data request failed (${response.status}) for ${pathname}.`);
  }

  const payload = (await response.json()) as GenericRecord;
  const status = readString(payload, ["status"]);

  if (status?.toLowerCase() === "error") {
    const message = readString(payload, ["message"]) || `Twelve Data returned an error for ${pathname}.`;
    throw new Error(message);
  }

  return payload;
}

function readString(record: GenericRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function readNumber(record: GenericRecord, keys: string[]) {
  for (const key of keys) {
    const value = Number(record[key]);

    if (Number.isFinite(value)) {
      return value;
    }
  }

  return Number.NaN;
}

function isRecord(value: unknown): value is GenericRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
