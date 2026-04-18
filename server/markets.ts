import { generateInvestmentSelections } from "./ai.js";
import type {
  FinancialSummary,
  InvestmentRecommendations,
  InvestmentSuggestion,
  MarketAssetSnapshot,
  WhatIfAssetPerformance,
  WhatIfPeriod,
  WhatIfScenario,
} from "../src/types.js";

const YAHOO_SPARK_URL = "https://query1.finance.yahoo.com/v7/finance/spark";
const TWELVE_DATA_BASE_URL = "https://api.twelvedata.com";
const twelveDataApiKey = process.env.TWELVE_DATA_API_KEY?.trim();
const MARKET_CACHE_MS = 15 * 60 * 1000;
const YAHOO_BATCH_SIZE = 20;

const PERIOD_CONFIG: Record<WhatIfPeriod, { label: string; days: number }> = {
  "1m": { label: "1 month", days: 30 },
  "3m": { label: "3 months", days: 90 },
  "6m": { label: "6 months", days: 180 },
  "1y": { label: "1 year", days: 365 },
};

const RECOMMENDATION_HORIZONS = [
  { horizon: "weeks", horizonLabel: "Next 4 weeks", period: "1m" },
  { horizon: "months", horizonLabel: "Next 3 months", period: "3m" },
  { horizon: "years", horizonLabel: "Next 1 year", period: "1y" },
] as const;

const YAHOO_PRIMARY_ASSETS = [
  { symbol: "AAPL", name: "Apple", category: "Large Cap Equity" },
  { symbol: "MSFT", name: "Microsoft", category: "Large Cap Equity" },
  { symbol: "NVDA", name: "NVIDIA", category: "Growth Equity" },
  { symbol: "AMZN", name: "Amazon", category: "Large Cap Equity" },
  { symbol: "GOOGL", name: "Alphabet", category: "Large Cap Equity" },
  { symbol: "META", name: "Meta", category: "Large Cap Equity" },
  { symbol: "TSLA", name: "Tesla", category: "Growth Equity" },
  { symbol: "BRK-B", name: "Berkshire Hathaway", category: "Conglomerate Equity" },
  { symbol: "JPM", name: "JPMorgan Chase", category: "Financial Equity" },
  { symbol: "V", name: "Visa", category: "Financial Equity" },
  { symbol: "MA", name: "Mastercard", category: "Financial Equity" },
  { symbol: "WMT", name: "Walmart", category: "Consumer Defensive Equity" },
  { symbol: "COST", name: "Costco", category: "Consumer Defensive Equity" },
  { symbol: "NFLX", name: "Netflix", category: "Communication Equity" },
  { symbol: "AMD", name: "AMD", category: "Semiconductor Equity" },
  { symbol: "AVGO", name: "Broadcom", category: "Semiconductor Equity" },
  { symbol: "ORCL", name: "Oracle", category: "Software Equity" },
  { symbol: "CRM", name: "Salesforce", category: "Software Equity" },
  { symbol: "ADBE", name: "Adobe", category: "Software Equity" },
  { symbol: "PEP", name: "PepsiCo", category: "Consumer Defensive Equity" },
  { symbol: "KO", name: "Coca-Cola", category: "Consumer Defensive Equity" },
  { symbol: "MCD", name: "McDonald's", category: "Consumer Defensive Equity" },
  { symbol: "DIS", name: "Disney", category: "Communication Equity" },
  { symbol: "XOM", name: "Exxon Mobil", category: "Energy Equity" },
  { symbol: "CVX", name: "Chevron", category: "Energy Equity" },
  { symbol: "UNH", name: "UnitedHealth", category: "Healthcare Equity" },
  { symbol: "LLY", name: "Eli Lilly", category: "Healthcare Equity" },
  { symbol: "JNJ", name: "Johnson & Johnson", category: "Healthcare Equity" },
  { symbol: "PFE", name: "Pfizer", category: "Healthcare Equity" },
  { symbol: "ABBV", name: "AbbVie", category: "Healthcare Equity" },
  { symbol: "MRK", name: "Merck", category: "Healthcare Equity" },
  { symbol: "BAC", name: "Bank of America", category: "Financial Equity" },
  { symbol: "GS", name: "Goldman Sachs", category: "Financial Equity" },
  { symbol: "MS", name: "Morgan Stanley", category: "Financial Equity" },
  { symbol: "C", name: "Citigroup", category: "Financial Equity" },
  { symbol: "BLK", name: "BlackRock", category: "Financial Equity" },
  { symbol: "SCHW", name: "Charles Schwab", category: "Financial Equity" },
  { symbol: "IBM", name: "IBM", category: "Technology Equity" },
  { symbol: "QCOM", name: "Qualcomm", category: "Semiconductor Equity" },
  { symbol: "TXN", name: "Texas Instruments", category: "Semiconductor Equity" },
  { symbol: "INTC", name: "Intel", category: "Semiconductor Equity" },
  { symbol: "MU", name: "Micron", category: "Semiconductor Equity" },
  { symbol: "SHOP", name: "Shopify", category: "Software Equity" },
  { symbol: "UBER", name: "Uber", category: "Mobility Equity" },
  { symbol: "PLTR", name: "Palantir", category: "Software Equity" },
  { symbol: "PANW", name: "Palo Alto Networks", category: "Cybersecurity Equity" },
  { symbol: "SNOW", name: "Snowflake", category: "Cloud Equity" },
  { symbol: "NOW", name: "ServiceNow", category: "Software Equity" },
  { symbol: "AMAT", name: "Applied Materials", category: "Semiconductor Equipment Equity" },
  { symbol: "LRCX", name: "Lam Research", category: "Semiconductor Equipment Equity" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", category: "Broad Market ETF" },
  { symbol: "QQQ", name: "Invesco QQQ", category: "Growth ETF" },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", category: "Broad Market ETF" },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", category: "Broad Market ETF" },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", category: "Small Cap ETF" },
  { symbol: "DIA", name: "SPDR Dow Jones Industrial Average ETF", category: "Blue Chip ETF" },
  { symbol: "XLK", name: "Technology Select Sector SPDR Fund", category: "Sector ETF" },
  { symbol: "XLF", name: "Financial Select Sector SPDR Fund", category: "Sector ETF" },
  { symbol: "XLE", name: "Energy Select Sector SPDR Fund", category: "Sector ETF" },
  { symbol: "XLV", name: "Health Care Select Sector SPDR Fund", category: "Sector ETF" },
  { symbol: "XLY", name: "Consumer Discretionary Select Sector SPDR Fund", category: "Sector ETF" },
  { symbol: "XLP", name: "Consumer Staples Select Sector SPDR Fund", category: "Sector ETF" },
  { symbol: "XLI", name: "Industrial Select Sector SPDR Fund", category: "Sector ETF" },
  { symbol: "XLU", name: "Utilities Select Sector SPDR Fund", category: "Sector ETF" },
  { symbol: "XLB", name: "Materials Select Sector SPDR Fund", category: "Sector ETF" },
  { symbol: "XLRE", name: "Real Estate Select Sector SPDR Fund", category: "Sector ETF" },
  { symbol: "ARKK", name: "ARK Innovation ETF", category: "Thematic ETF" },
  { symbol: "SMH", name: "VanEck Semiconductor ETF", category: "Thematic ETF" },
  { symbol: "SOXX", name: "iShares Semiconductor ETF", category: "Thematic ETF" },
  { symbol: "GLD", name: "SPDR Gold Shares", category: "Commodity ETF" },
  { symbol: "SLV", name: "iShares Silver Trust", category: "Commodity ETF" },
  { symbol: "USO", name: "United States Oil Fund", category: "Commodity ETF" },
  { symbol: "TLT", name: "iShares 20+ Year Treasury Bond ETF", category: "Bond ETF" },
  { symbol: "IEF", name: "iShares 7-10 Year Treasury Bond ETF", category: "Bond ETF" },
  { symbol: "SHY", name: "iShares 1-3 Year Treasury Bond ETF", category: "Bond ETF" },
  { symbol: "HYG", name: "iShares iBoxx $ High Yield Corporate Bond ETF", category: "Bond ETF" },
  { symbol: "LQD", name: "iShares iBoxx $ Investment Grade Corporate Bond ETF", category: "Bond ETF" },
  { symbol: "TIP", name: "iShares TIPS Bond ETF", category: "Bond ETF" },
  { symbol: "VNQ", name: "Vanguard Real Estate ETF", category: "Real Estate ETF" },
  { symbol: "AGG", name: "iShares Core U.S. Aggregate Bond ETF", category: "Bond ETF" },
  { symbol: "BTC-USD", name: "Bitcoin", category: "Crypto" },
  { symbol: "ETH-USD", name: "Ethereum", category: "Crypto" },
  { symbol: "SOL-USD", name: "Solana", category: "Crypto" },
  { symbol: "XRP-USD", name: "XRP", category: "Crypto" },
  { symbol: "ADA-USD", name: "Cardano", category: "Crypto" },
  { symbol: "DOGE-USD", name: "Dogecoin", category: "Crypto" },
  { symbol: "BNB-USD", name: "BNB", category: "Crypto" },
  { symbol: "LINK-USD", name: "Chainlink", category: "Crypto" },
  { symbol: "AVAX-USD", name: "Avalanche", category: "Crypto" },
  { symbol: "LTC-USD", name: "Litecoin", category: "Crypto" },
  { symbol: "FXAIX", name: "Fidelity 500 Index Fund", category: "Mutual Fund" },
  { symbol: "SWPPX", name: "Schwab S&P 500 Index Fund", category: "Mutual Fund" },
  { symbol: "VTSAX", name: "Vanguard Total Stock Market Index Fund", category: "Mutual Fund" },
  { symbol: "VFIAX", name: "Vanguard 500 Index Fund Admiral Shares", category: "Mutual Fund" },
  { symbol: "FSKAX", name: "Fidelity Total Market Index Fund", category: "Mutual Fund" },
  { symbol: "FCNTX", name: "Fidelity Contrafund", category: "Mutual Fund" },
  { symbol: "VWELX", name: "Vanguard Wellington Fund", category: "Balanced Fund" },
  { symbol: "VTWAX", name: "Vanguard Total World Stock Index Fund", category: "Mutual Fund" },
  { symbol: "VIGAX", name: "Vanguard Growth Index Fund Admiral Shares", category: "Growth Fund" },
  { symbol: "VFINX", name: "Vanguard 500 Index Investor Fund", category: "Mutual Fund" },
] as const;

const TWELVE_FALLBACK_ASSETS = [
  { symbol: "AAPL", name: "Apple", category: "Large Cap Equity" },
  { symbol: "MSFT", name: "Microsoft", category: "Large Cap Equity" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", category: "Broad Market ETF" },
  { symbol: "QQQ", name: "Invesco QQQ", category: "Growth ETF" },
  { symbol: "BTC/USD", name: "Bitcoin", category: "Crypto" },
  { symbol: "ETH/USD", name: "Ethereum", category: "Crypto" },
  { symbol: "AGG", name: "iShares Core U.S. Aggregate Bond ETF", category: "Bond ETF" },
  { symbol: "FXAIX", name: "Fidelity 500 Index Fund", category: "Mutual Fund" },
] as const;

type AssetDefinition = {
  symbol: string;
  name: string;
  category: string;
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

type YahooSparkResponse = {
  spark?: {
    result?: Array<{
      symbol?: string;
      response?: Array<{
        meta?: {
          currency?: string;
          longName?: string;
          shortName?: string;
        };
        timestamp?: number[];
        indicators?: {
          quote?: Array<{
            close?: Array<number | null>;
          }>;
        };
      }>;
    }>;
  };
};

let priceSeriesCache: { expiresAt: number; seriesBySymbol: Map<string, AssetSeries>; provider: "yahoo" | "twelve" } | null = null;

export async function buildWhatIfScenario(period: WhatIfPeriod, amount: number): Promise<WhatIfScenario> {
  const normalizedAmount = Number(amount);
  const config = PERIOD_CONFIG[period];

  if (!config) {
    throw new Error("Unsupported lookback period.");
  }

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error("Simulation amount must be greater than zero.");
  }

  const { provider, seriesBySymbol } = await loadMarketSeries();
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
      provider === "yahoo"
        ? "This compares the strongest performer in SmartBudget's Yahoo market screen across 100 instruments. Taxes, fees, and FX slippage are excluded."
        : "This compares the strongest performer in SmartBudget's Twelve Data backup screen. Taxes, fees, and FX slippage are excluded.",
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

  const { provider, seriesBySymbol } = await loadMarketSeries();
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
      provider === "yahoo"
        ? "These are scenario estimates based on SmartBudget's Yahoo market screen across 100 curated instruments. They are not guaranteed returns and do not include taxes, fees, or slippage."
        : "These are scenario estimates based on SmartBudget's Twelve Data backup screen. They are not guaranteed returns and do not include taxes, fees, or slippage.",
  };
}

export async function buildMarketInsights(input: {
  amount: number;
  summary: Pick<FinancialSummary, "healthScore" | "savingsRate" | "cashFlow" | "netWorth">;
}) {
  const { provider, seriesBySymbol } = await loadMarketSeries();
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
        provider === "yahoo"
          ? "These are scenario estimates based on SmartBudget's Yahoo market screen across 100 curated instruments. They are not guaranteed returns and do not include taxes, fees, or slippage."
          : "These are scenario estimates based on SmartBudget's Twelve Data backup screen. They are not guaranteed returns and do not include taxes, fees, or slippage.",
    },
    whatIfByPeriod,
    disclaimer:
      provider === "yahoo"
        ? "SmartBudget is using a cached Yahoo market screen across 100 curated instruments."
        : "SmartBudget is using the Twelve Data backup screen because Yahoo data was unavailable right now.",
  };
}

async function loadMarketSeries(): Promise<{ provider: "yahoo" | "twelve"; seriesBySymbol: Map<string, AssetSeries> }> {
  if (priceSeriesCache && priceSeriesCache.expiresAt > Date.now()) {
    return {
      provider: priceSeriesCache.provider,
      seriesBySymbol: priceSeriesCache.seriesBySymbol,
    };
  }

  try {
    const yahooSeries = await fetchYahooPrimarySeries();

    if (yahooSeries.size > 0) {
      priceSeriesCache = {
        expiresAt: Date.now() + MARKET_CACHE_MS,
        seriesBySymbol: yahooSeries,
        provider: "yahoo",
      };
      return {
        provider: "yahoo",
        seriesBySymbol: yahooSeries,
      };
    }
  } catch {
    // Fall through to Twelve Data backup.
  }

  const twelveSeries = await fetchTwelveFallbackSeries();

  if (twelveSeries.size === 0) {
    throw new Error("Market data is unavailable right now.");
  }

  priceSeriesCache = {
    expiresAt: Date.now() + MARKET_CACHE_MS,
    seriesBySymbol: twelveSeries,
    provider: "twelve",
  };

  return {
    provider: "twelve",
    seriesBySymbol: twelveSeries,
  };
}

async function fetchYahooPrimarySeries() {
  const batches = chunkArray(YAHOO_PRIMARY_ASSETS, YAHOO_BATCH_SIZE);
  const settled = await Promise.allSettled(batches.map((batch) => fetchYahooSparkBatch(batch)));
  const combined = new Map<string, AssetSeries>();

  for (const entry of settled) {
    if (entry.status !== "fulfilled") {
      continue;
    }

    for (const [symbol, series] of entry.value.entries()) {
      combined.set(symbol, series);
    }
  }

  return combined;
}

async function fetchYahooSparkBatch(assets: readonly AssetDefinition[]) {
  const url = new URL(YAHOO_SPARK_URL);
  url.search = new URLSearchParams({
    symbols: assets.map((asset) => asset.symbol).join(","),
    range: "1y",
    interval: "1d",
    includePrePost: "false",
    indicators: "close",
  }).toString();

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; SmartBudget/1.0; +https://smartbudget.app)",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Yahoo Spark request failed (${response.status}).`);
  }

  const payload = (await response.json()) as YahooSparkResponse;
  const results = Array.isArray(payload.spark?.result) ? payload.spark.result : [];
  const assetMap = new Map(assets.map((asset) => [asset.symbol, asset]));
  const seriesMap = new Map<string, AssetSeries>();

  for (const result of results) {
    const symbol = typeof result.symbol === "string" ? result.symbol : null;
    const responsePayload = Array.isArray(result.response) ? result.response[0] : null;
    const asset = symbol ? assetMap.get(symbol) : null;

    if (!symbol || !responsePayload || !asset) {
      continue;
    }

    const timestamps = Array.isArray(responsePayload.timestamp) ? responsePayload.timestamp : [];
    const close = responsePayload.indicators?.quote?.[0]?.close;
    const points = buildPricePoints(close, timestamps);

    if (points.length < 2) {
      continue;
    }

    seriesMap.set(symbol, {
      symbol,
      name: responsePayload.meta?.longName?.trim() || responsePayload.meta?.shortName?.trim() || asset.name,
      category: asset.category,
      currency: responsePayload.meta?.currency?.trim() || "USD",
      points,
    });
  }

  return seriesMap;
}

async function fetchTwelveFallbackSeries() {
  if (!twelveDataApiKey) {
    return new Map<string, AssetSeries>();
  }

  const payload = await fetchTwelveJson("/time_series", {
    symbol: TWELVE_FALLBACK_ASSETS.map((asset) => asset.symbol).join(","),
    interval: "1day",
    outputsize: "390",
  });

  const seriesMap = new Map<string, AssetSeries>();

  for (const asset of TWELVE_FALLBACK_ASSETS) {
    const entry = isRecord(payload[asset.symbol]) ? (payload[asset.symbol] as GenericRecord) : null;

    if (!entry || readString(entry, ["status"])?.toLowerCase() === "error") {
      continue;
    }

    const meta = isRecord(entry.meta) ? entry.meta : {};
    const points = extractTwelvePricePoints(entry);

    if (points.length < 2) {
      continue;
    }

    seriesMap.set(asset.symbol, {
      symbol: asset.symbol,
      name: asset.name,
      category: asset.category,
      currency: readString(meta, ["currency"]) || "USD",
      points,
    });
  }

  return seriesMap;
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
    disclaimer: "Scenario recalculates locally from the cached market snapshot without another provider request.",
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
      : "Its momentum is the strongest after adjusting for volatility in SmartBudget's cached market screen.";

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

function chunkArray<T>(items: readonly T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
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
