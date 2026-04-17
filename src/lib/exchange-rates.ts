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

  const url = new URL("https://api.frankfurter.dev/v1/latest");
  url.searchParams.set("base", base);
  url.searchParams.set("symbols", quotes.join(","));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Unable to load exchange rates (${response.status}).`);
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
