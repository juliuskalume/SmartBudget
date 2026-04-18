import type { CurrencyCode, ExchangeRateSnapshot } from "../types";

const USD_FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  TRY: 32.5,
};

export async function fetchExchangeRates(baseCurrency: CurrencyCode, quoteCurrencies: CurrencyCode[]): Promise<ExchangeRateSnapshot> {
  const base = normalizeCurrencyCode(baseCurrency, "USD");
  const quotes = Array.from(
    new Set(
      quoteCurrencies
        .map((currency) => normalizeCurrencyCode(currency, ""))
        .filter((currency) => currency && currency !== base),
    ),
  );

  if (quotes.length === 0) {
    return {
      base,
      date: null,
      rates: {},
      source: "fallback",
    };
  }

  // Try Exchange Rate API first
  try {
    const exchangeRateResult = await fetchFromExchangeRateApi(base, quotes);
    return exchangeRateResult;
  } catch (exchangeRateError) {
    // Fallback to Frankfurter if Exchange Rate API fails
    try {
      const frankfurterResult = await fetchFromFrankfurter(base, quotes);
      return frankfurterResult;
    } catch (frankfurterError) {
      // If both fail, throw the original Exchange Rate API error
      throw exchangeRateError;
    }
  }
}

async function fetchFromFrankfurter(base: string, quotes: string[]): Promise<ExchangeRateSnapshot> {
  const url = new URL("https://api.frankfurter.dev/v1/latest");
  url.searchParams.set("base", base);
  url.searchParams.set("symbols", quotes.join(","));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Frankfurter request failed (${response.status}).`);
  }

  const payload = await response.json();
  const rates = typeof payload?.rates === "object" && payload.rates ? (payload.rates as Record<string, number>) : {};

  return {
    base,
    date: typeof payload?.date === "string" ? payload.date : null,
    rates: Object.fromEntries(
      Object.entries(rates)
        .map(([currency, value]) => [normalizeCurrencyCode(currency), Number(value)])
        .filter((entry) => Number.isFinite(entry[1])),
    ),
    source: "frankfurter",
  };
}

async function fetchFromExchangeRateApi(base: string, quotes: string[]): Promise<ExchangeRateSnapshot> {
  // Call the server endpoint instead of the API directly (API key stays server-side)
  const quotesParam = quotes.join(",");
  const url = `/api/exchange-rates?base=${encodeURIComponent(base)}&quotes=${encodeURIComponent(quotesParam)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Exchange Rate API request failed (${response.status}).`);
  }

  const payload = await response.json();

  const allRates = typeof payload?.rates === "object" && payload.rates ? (payload.rates as Record<string, number>) : {};

  // Filter to only requested quote currencies
  const filteredRates = Object.fromEntries(
    quotes
      .map((quote) => {
        const rateValue = allRates[quote];
        return [quote, rateValue];
      })
      .filter((entry): entry is [string, number] => Number.isFinite(entry[1])),
  );

  return {
    base,
    date: null,
    rates: filteredRates,
    source: "exchangerate-api",
  };
}

export function buildFallbackExchangeRates(baseCurrency: CurrencyCode, quoteCurrencies: CurrencyCode[]): ExchangeRateSnapshot {
  const base = normalizeCurrencyCode(baseCurrency, "USD");
  const rates: Record<string, number> = {};

  for (const quoteCurrency of quoteCurrencies) {
    const quote = normalizeCurrencyCode(quoteCurrency, "");
    if (!quote || quote === base) {
      continue;
    }

    const fallbackRate = getFallbackRate(base, quote);
    if (fallbackRate !== null) {
      rates[quote] = fallbackRate;
    }
  }

  return {
    base,
    date: null,
    rates,
    source: "fallback",
  };
}

export function getFallbackRate(baseCurrency: CurrencyCode, quoteCurrency: CurrencyCode) {
  const base = normalizeCurrencyCode(baseCurrency, "USD");
  const quote = normalizeCurrencyCode(quoteCurrency, "USD");
  const baseUsd = USD_FALLBACK_RATES[base];
  const quoteUsd = USD_FALLBACK_RATES[quote];

  if (!baseUsd || !quoteUsd) {
    return null;
  }

  return quoteUsd / baseUsd;
}

export function normalizeCurrencyCode(currency: string | null | undefined, fallback = "USD") {
  if (!currency || typeof currency !== "string") {
    return fallback;
  }

  const trimmed = currency.trim().toUpperCase();
  if (!trimmed) {
    return fallback;
  }

  if (trimmed === "TL" || trimmed === "₺" || trimmed === "TRY") {
    return "TRY";
  }

  if (trimmed === "$" || trimmed === "USD") {
    return "USD";
  }

  if (trimmed === "€" || trimmed === "EUR") {
    return "EUR";
  }

  return /^[A-Z]{3}$/.test(trimmed) ? trimmed : fallback;
}
