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

const TRACKED_ASSETS = [
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

type AssetDefinition = (typeof TRACKED_ASSETS)[number];

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        currency?: string;
        regularMarketPrice?: number;
      };
      timestamp?: number[];
      indicators?: {
        adjclose?: Array<{ adjclose?: Array<number | null> }>;
        quote?: Array<{ close?: Array<number | null> }>;
      };
    }>;
    error?: {
      description?: string;
    } | null;
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

export async function buildWhatIfScenario(period: WhatIfPeriod, amount: number): Promise<WhatIfScenario> {
  const normalizedAmount = Number(amount);
  const config = PERIOD_CONFIG[period];

  if (!config) {
    throw new Error("Unsupported lookback period.");
  }

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error("Simulation amount must be greater than zero.");
  }

  const settled = await Promise.allSettled(
    TRACKED_ASSETS.map(async (asset) => buildWhatIfAssetPerformance(await fetchAssetSeries(asset), period, normalizedAmount)),
  );

  const assets = settled
    .filter((entry): entry is PromiseFulfilledResult<WhatIfAssetPerformance> => entry.status === "fulfilled")
    .map((entry) => entry.value)
    .sort((left, right) => right.returnPct - left.returnPct);

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
    disclaimer: "This compares a tracked basket of assets, not the entire market, and excludes taxes, fees, and FX slippage.",
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

  const settled = await Promise.allSettled(TRACKED_ASSETS.map((asset) => fetchMarketSnapshot(asset)));
  const market = settled
    .filter((entry): entry is PromiseFulfilledResult<MarketAssetSnapshot> => entry.status === "fulfilled")
    .map((entry) => entry.value)
    .sort((left, right) => right.returns["3m"] - left.returns["3m"]);

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
      "These are scenario estimates based on recent momentum in a tracked market universe. They are not guaranteed future returns and do not include taxes, fees, or slippage.",
  };
}

async function fetchAssetSeries(asset: AssetDefinition): Promise<AssetSeries> {
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

async function fetchMarketSnapshot(asset: AssetDefinition): Promise<MarketAssetSnapshot> {
  const series = await fetchAssetSeries(asset);
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
      (aiSelection ? input.market.find((entry) => entry.symbol === aiSelection.assetSymbol) : null) ??
      pickFallbackAsset(input.market, config.period, input.summary);

    return createInvestmentSuggestion({
      amount: input.amount,
      asset,
      horizon: config.horizon,
      horizonLabel: config.horizonLabel,
      period: config.period,
      rationale:
        aiSelection?.rationale ??
        buildFallbackRationale(asset, config.period, input.summary),
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
      : "Its momentum is the strongest after adjusting for volatility in the tracked market.";

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
