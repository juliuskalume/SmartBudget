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

const DISCOVERY_LIMITS = {
  moversPerMarket: 12,
  catalogPerMarket: 8,
  bonds: 12,
  batchSize: 8,
  candidateCacheMs: 15 * 60 * 1000,
  seriesCacheMs: 15 * 60 * 1000,
};

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

const CORE_TWELVE_ASSETS = [
  { symbol: "AAPL", name: "Apple", category: "Large Cap Equity", type: "Common Stock", market: "stocks" },
  { symbol: "MSFT", name: "Microsoft", category: "Large Cap Equity", type: "Common Stock", market: "stocks" },
  { symbol: "NVDA", name: "NVIDIA", category: "Growth Equity", type: "Common Stock", market: "stocks" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", category: "ETF", type: "ETF", market: "etf" },
  { symbol: "QQQ", name: "Invesco QQQ", category: "ETF", type: "ETF", market: "etf" },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", category: "ETF", type: "ETF", market: "etf" },
  { symbol: "BTC/USD", name: "Bitcoin", category: "Crypto", type: "Digital Currency", market: "crypto" },
  { symbol: "ETH/USD", name: "Ethereum", category: "Crypto", type: "Digital Currency", market: "crypto" },
  { symbol: "SOL/USD", name: "Solana", category: "Crypto", type: "Digital Currency", market: "crypto" },
  { symbol: "AGG", name: "iShares Core U.S. Aggregate Bond ETF", category: "Bond ETF", type: "ETF", market: "etf" },
  { symbol: "TLT", name: "iShares 20+ Year Treasury Bond ETF", category: "Bond ETF", type: "ETF", market: "etf" },
  { symbol: "FXAIX", name: "Fidelity 500 Index Fund", category: "Mutual Fund", type: "Mutual Fund", market: "mutual_funds" },
] as const;

type MarketKey = "stocks" | "etf" | "mutual_funds" | "crypto" | "bond";

type LegacyAssetDefinition = {
  provider: "legacy";
  symbol: string;
  name: string;
  category: string;
};

type TwelveAssetDefinition = {
  provider: "twelve";
  symbol: string;
  name: string;
  category: string;
  type?: string;
  market: MarketKey;
  exchange?: string;
  country?: string;
};

type AssetDefinition = LegacyAssetDefinition | TwelveAssetDefinition;

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

type GenericRecord = Record<string, unknown>;

let candidateUniverseCache: { expiresAt: number; candidates: AssetDefinition[] } | null = null;
const priceSeriesCache = new Map<string, { expiresAt: number; series: AssetSeries }>();

export async function buildWhatIfScenario(period: WhatIfPeriod, amount: number): Promise<WhatIfScenario> {
  const normalizedAmount = Number(amount);
  const config = PERIOD_CONFIG[period];

  if (!config) {
    throw new Error("Unsupported lookback period.");
  }

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error("Simulation amount must be greater than zero.");
  }

  const assets = await loadAssetPerformances(period, normalizedAmount);

  if (assets.length === 0) {
    throw new Error("Market data is unavailable right now.");
  }

  const bestAsset = assets[0];
  const isProviderBacked = Boolean(twelveDataApiKey);

  return {
    period,
    periodLabel: config.label,
    amount: normalizedAmount,
    startDate: bestAsset.startDate,
    endDate: bestAsset.endDate,
    bestAsset,
    assets,
    disclaimer: isProviderBacked
      ? "This compares the strongest performer in SmartBudget's current Twelve Data market screen across multiple asset classes. Taxes, fees, and FX slippage are excluded."
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

  const market = await loadMarketSnapshots();

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
      twelveDataApiKey
        ? "These are scenario estimates based on SmartBudget's live Twelve Data screen across stocks, ETFs, mutual funds, crypto, and bond instruments. They are not guaranteed returns and do not include taxes, fees, or slippage."
        : "These are scenario estimates based on a fallback market screen. They are not guaranteed returns and do not include taxes, fees, or slippage.",
  };
}

async function loadAssetPerformances(period: WhatIfPeriod, amount: number) {
  const universe = await resolveAssetUniverse();
  const settled = await mapInBatches(universe, DISCOVERY_LIMITS.batchSize, async (asset) =>
    buildWhatIfAssetPerformance(await fetchAssetSeries(asset), period, amount),
  );

  return settled
    .filter((entry): entry is PromiseFulfilledResult<WhatIfAssetPerformance> => entry.status === "fulfilled")
    .map((entry) => entry.value)
    .sort((left, right) => right.returnPct - left.returnPct);
}

async function loadMarketSnapshots() {
  const universe = await resolveAssetUniverse();
  const settled = await mapInBatches(universe, DISCOVERY_LIMITS.batchSize, async (asset) =>
    fetchMarketSnapshot(asset),
  );

  return settled
    .filter((entry): entry is PromiseFulfilledResult<MarketAssetSnapshot> => entry.status === "fulfilled")
    .map((entry) => entry.value)
    .sort((left, right) => right.returns["3m"] - left.returns["3m"]);
}

async function resolveAssetUniverse(): Promise<AssetDefinition[]> {
  if (twelveDataApiKey) {
    if (candidateUniverseCache && candidateUniverseCache.expiresAt > Date.now()) {
      return candidateUniverseCache.candidates;
    }

    const discovered = await discoverTwelveDataUniverse();

    if (discovered.length > 0) {
      candidateUniverseCache = {
        expiresAt: Date.now() + DISCOVERY_LIMITS.candidateCacheMs,
        candidates: discovered,
      };
      return discovered;
    }
  }

  return LEGACY_TRACKED_ASSETS.map((asset) => ({
    provider: "legacy" as const,
    ...asset,
  }));
}

async function discoverTwelveDataUniverse(): Promise<AssetDefinition[]> {
  const [stockMovers, etfMovers, fundMovers, cryptoMovers, stockCatalog, etfCatalog, fundCatalog, cryptoCatalog, bondCatalog] =
    await Promise.allSettled([
      fetchTwelveMarketMovers("stocks", DISCOVERY_LIMITS.moversPerMarket),
      fetchTwelveMarketMovers("etf", DISCOVERY_LIMITS.moversPerMarket),
      fetchTwelveMarketMovers("mutual_funds", DISCOVERY_LIMITS.moversPerMarket),
      fetchTwelveMarketMovers("crypto", DISCOVERY_LIMITS.moversPerMarket),
      fetchTwelveCatalog("stocks", DISCOVERY_LIMITS.catalogPerMarket),
      fetchTwelveCatalog("etfs", DISCOVERY_LIMITS.catalogPerMarket),
      fetchTwelveCatalog("funds", DISCOVERY_LIMITS.catalogPerMarket),
      fetchTwelveCatalog("cryptocurrencies", DISCOVERY_LIMITS.catalogPerMarket),
      fetchTwelveBonds(DISCOVERY_LIMITS.bonds),
    ]);

  const discovered = dedupeAssetDefinitions([
    ...normalizeSettledValue(stockMovers),
    ...normalizeSettledValue(etfMovers),
    ...normalizeSettledValue(fundMovers),
    ...normalizeSettledValue(cryptoMovers),
    ...normalizeSettledValue(stockCatalog),
    ...normalizeSettledValue(etfCatalog),
    ...normalizeSettledValue(fundCatalog),
    ...normalizeSettledValue(cryptoCatalog),
    ...normalizeSettledValue(bondCatalog),
    ...CORE_TWELVE_ASSETS.map((asset) => ({
      provider: "twelve" as const,
      ...asset,
    })),
  ]);

  return discovered.slice(0, 80);
}

async function fetchTwelveMarketMovers(market: Exclude<MarketKey, "bond">, limit: number) {
  const payload = await fetchTwelveJson(`/market_movers/${market}`, {
    direction: "gainers",
    outputsize: String(limit),
  });

  return normalizeTwelveCandidates(extractRecordArray(payload), market);
}

async function fetchTwelveCatalog(endpoint: "stocks" | "etfs" | "funds" | "cryptocurrencies", limit: number) {
  const payload = await fetchTwelveJson(`/${endpoint}`, {
    outputsize: String(limit),
    page: "1",
  });

  const market = endpoint === "stocks" ? "stocks" : endpoint === "etfs" ? "etf" : endpoint === "funds" ? "mutual_funds" : "crypto";
  return normalizeTwelveCandidates(extractRecordArray(payload), market);
}

async function fetchTwelveBonds(limit: number) {
  const payload = await fetchTwelveJson("/bonds", {
    outputsize: String(limit),
    page: "1",
    country: "United States",
  });

  return normalizeTwelveCandidates(extractRecordArray(payload), "bond");
}

function normalizeTwelveCandidates(records: GenericRecord[], market: MarketKey): TwelveAssetDefinition[] {
  const normalized: Array<TwelveAssetDefinition | null> = records.map((record) => {
      const symbol = readString(record, ["symbol", "ticker"]);
      if (!symbol) {
        return null;
      }

      const exchange = readString(record, ["exchange", "mic_code"]);
      const country = readString(record, ["country"]);
      const name =
        readString(record, ["name", "instrument_name"]) ||
        buildTwelveDisplayName(record, market, symbol);
      const type = readString(record, ["type"]) || getDefaultTypeForMarket(market);

      return {
        provider: "twelve" as const,
        symbol,
        name,
        category: getCategoryForRecord(record, market),
        type,
        market,
        exchange,
        country,
      };
    });

  return normalized.filter((asset): asset is TwelveAssetDefinition => asset !== null);
}

function buildTwelveDisplayName(record: GenericRecord, market: MarketKey, fallbackSymbol: string) {
  if (market === "crypto") {
    const base = readString(record, ["currency_base"]);
    const quote = readString(record, ["currency_quote"]);

    if (base && quote) {
      return `${base} / ${quote}`;
    }
  }

  return fallbackSymbol;
}

function getDefaultTypeForMarket(market: MarketKey) {
  switch (market) {
    case "stocks":
      return "Common Stock";
    case "etf":
      return "ETF";
    case "mutual_funds":
      return "Mutual Fund";
    case "crypto":
      return "Digital Currency";
    case "bond":
      return "Bond";
    default:
      return undefined;
  }
}

function getCategoryForRecord(record: GenericRecord, market: MarketKey) {
  const explicitType = readString(record, ["type"]);

  if (market === "crypto") {
    return "Crypto";
  }

  if (market === "bond") {
    return explicitType || "Bond";
  }

  if (market === "etf") {
    return explicitType || "ETF";
  }

  if (market === "mutual_funds") {
    return explicitType || "Mutual Fund";
  }

  return explicitType || "Common Stock";
}

async function fetchAssetSeries(asset: AssetDefinition): Promise<AssetSeries> {
  return asset.provider === "twelve" ? fetchTwelveAssetSeries(asset) : fetchYahooAssetSeries(asset);
}

async function fetchTwelveAssetSeries(asset: TwelveAssetDefinition): Promise<AssetSeries> {
  const cacheKey = `twelve:${asset.symbol}:${asset.type ?? ""}`;
  const cached = priceSeriesCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.series;
  }

  const payload = await fetchTwelveJson("/time_series", {
    symbol: asset.symbol,
    interval: "1day",
    outputsize: "390",
    ...(asset.type ? { type: asset.type } : {}),
  });

  const meta = isRecord(payload.meta) ? payload.meta : {};
  const points = extractTwelvePricePoints(payload);

  if (points.length < 2) {
    throw new Error(`No time series returned for ${asset.symbol}.`);
  }

  const series: AssetSeries = {
    symbol: asset.symbol,
    name: asset.name,
    category: asset.category,
    currency: readString(meta, ["currency"]) || "USD",
    points,
  };

  priceSeriesCache.set(cacheKey, {
    expiresAt: Date.now() + DISCOVERY_LIMITS.seriesCacheMs,
    series,
  });

  return series;
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
      : "Its momentum is the strongest after adjusting for volatility in SmartBudget's current live market screen.";

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
  return extractRecordArray(payload)
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
  const searchParams = new URLSearchParams({
    ...params,
    apikey: twelveDataApiKey,
    format: "JSON",
  });
  url.search = searchParams.toString();

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
    const message = readString(payload, ["message"]) || readString(payload, ["code"]) || `Twelve Data returned an error for ${pathname}.`;
    throw new Error(message);
  }

  return payload;
}

function extractRecordArray(payload: GenericRecord): GenericRecord[] {
  const candidates: unknown[] = [
    payload.data,
    payload.values,
    payload.result,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(isRecord);
    }

    if (isRecord(candidate)) {
      const nested = [candidate.data, candidate.values, candidate.result, candidate.list];

      for (const entry of nested) {
        if (Array.isArray(entry)) {
          return entry.filter(isRecord);
        }
      }
    }
  }

  return [];
}

function dedupeAssetDefinitions(assets: AssetDefinition[]) {
  const seen = new Set<string>();

  return assets.filter((asset) => {
    const key = asset.symbol.trim().toUpperCase();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normalizeSettledValue<T>(result: PromiseSettledResult<T[]>) {
  return result.status === "fulfilled" ? result.value : [];
}

async function mapInBatches<T, R>(items: T[], batchSize: number, worker: (item: T) => Promise<R>) {
  const settled: Array<PromiseSettledResult<R>> = [];

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    const results = await Promise.allSettled(batch.map((item) => worker(item)));
    settled.push(...results);
  }

  return settled;
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
    const value = record[key];
    const numeric = Number(value);

    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return Number.NaN;
}

function isRecord(value: unknown): value is GenericRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
