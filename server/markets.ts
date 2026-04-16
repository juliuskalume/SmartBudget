import type { WhatIfAssetPerformance, WhatIfPeriod, WhatIfScenario } from "../src/types";

const YAHOO_BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart";

const PERIOD_CONFIG: Record<WhatIfPeriod, { range: string; label: string }> = {
  "1m": { range: "1mo", label: "1 month" },
  "3m": { range: "3mo", label: "3 months" },
  "6m": { range: "6mo", label: "6 months" },
  "1y": { range: "1y", label: "1 year" },
};

const TRACKED_ASSETS = [
  { symbol: "BTC-USD", name: "Bitcoin", category: "Crypto" },
  { symbol: "ETH-USD", name: "Ethereum", category: "Crypto" },
  { symbol: "QQQ", name: "Invesco QQQ", category: "Equity ETF" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", category: "Equity ETF" },
  { symbol: "GLD", name: "SPDR Gold Shares", category: "Commodity ETF" },
] as const;

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
    TRACKED_ASSETS.map(async (asset) => {
      return fetchAssetPerformance(asset.symbol, asset.name, asset.category, config.range, normalizedAmount);
    }),
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

async function fetchAssetPerformance(
  symbol: string,
  name: string,
  category: string,
  range: string,
  amount: number,
): Promise<WhatIfAssetPerformance> {
  const response = await fetch(`${YAHOO_BASE_URL}/${encodeURIComponent(symbol)}?range=${range}&interval=1d`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SmartBudget/1.0; +https://smartbudget.app)",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Market request failed for ${symbol}.`);
  }

  const payload = (await response.json()) as YahooChartResponse;
  const result = payload.chart?.result?.[0];
  const timestamps = Array.isArray(result?.timestamp) ? result.timestamp : [];
  const adjClose = result?.indicators?.adjclose?.[0]?.adjclose;
  const close = result?.indicators?.quote?.[0]?.close;
  const prices = Array.isArray(adjClose) && adjClose.length > 0 ? adjClose : close;

  if (!result || !Array.isArray(prices) || prices.length === 0 || timestamps.length === 0) {
    throw new Error(`No market history returned for ${symbol}.`);
  }

  const firstPoint = findBoundaryPoint(prices, timestamps, "start");
  const lastPoint = findBoundaryPoint(prices, timestamps, "end");

  if (!firstPoint || !lastPoint || firstPoint.price <= 0 || lastPoint.price <= 0) {
    throw new Error(`Incomplete market history for ${symbol}.`);
  }

  const currentValue = (amount / firstPoint.price) * lastPoint.price;
  const gain = currentValue - amount;

  return {
    symbol,
    name,
    category,
    currency: result.meta?.currency?.trim() || "USD",
    startDate: new Date(firstPoint.timestamp * 1000).toISOString(),
    endDate: new Date(lastPoint.timestamp * 1000).toISOString(),
    startPrice: firstPoint.price,
    endPrice: lastPoint.price,
    returnPct: amount > 0 ? (gain / amount) * 100 : 0,
    investedAmount: amount,
    currentValue,
    gain,
  };
}

function findBoundaryPoint(prices: Array<number | null>, timestamps: number[], boundary: "start" | "end") {
  const pairs = prices.map((price, index) => ({
    price: Number(price),
    timestamp: Number(timestamps[index]),
  }));

  const ordered = boundary === "start" ? pairs : [...pairs].reverse();
  const match = ordered.find((entry) => Number.isFinite(entry.price) && entry.price > 0 && Number.isFinite(entry.timestamp));

  return match
    ? {
        price: match.price,
        timestamp: match.timestamp,
      }
    : null;
}
