import type { BalancePurchasingPowerShift } from "../types";
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY_CODE, type CountryOption } from "./country-data";
import { normalizeCurrencyCode } from "./exchange-rates";

const countryMap = new Map(COUNTRY_OPTIONS.map((country) => [country.code, country]));

export function getCountryOptions() {
  return COUNTRY_OPTIONS;
}

export function getCountryByCode(code?: string | null): CountryOption {
  const normalized = typeof code === "string" ? code.trim().toUpperCase() : "";
  return countryMap.get(normalized) ?? countryMap.get(DEFAULT_COUNTRY_CODE) ?? COUNTRY_OPTIONS[0];
}

export function getCountryCurrency(code?: string | null) {
  return getCountryByCode(code).currency;
}

export function inferCountryCodeFromLocale(locale?: string | null) {
  const resolvedLocale =
    typeof locale === "string" && locale.trim()
      ? locale
      : typeof navigator !== "undefined"
        ? navigator.language
        : "";
  const region = resolvedLocale.match(/[-_](\w{2})\b/)?.[1]?.toUpperCase();

  if (region && countryMap.has(region)) {
    return region;
  }

  return DEFAULT_COUNTRY_CODE;
}

export function formatInflationMonth(month: string | null) {
  if (!month) {
    return null;
  }

  const value = new Date(`${month}-01T00:00:00Z`);
  if (Number.isNaN(value.getTime())) {
    return month;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export function getBalancePurchasingPowerShift(countryCode?: string | null): BalancePurchasingPowerShift | null {
  const country = getCountryByCode(countryCode);
  if (country.latestMonthlyInflationPct === null) {
    return null;
  }

  return {
    countryCode: country.code,
    countryName: country.name,
    latestMonth: formatInflationMonth(country.latestInflationMonth),
    inflationPct: country.latestMonthlyInflationPct,
    purchasingPowerShiftPct: -country.latestMonthlyInflationPct,
    isIncrease: country.latestMonthlyInflationPct <= 0,
    source: "bundled",
  };
}

export function getCurrencyChoices(localCurrency: string) {
  const normalizedLocal = normalizeCurrencyCode(localCurrency, "USD");
  const currencies = new Set<string>([normalizedLocal]);

  for (const country of COUNTRY_OPTIONS) {
    currencies.add(normalizeCurrencyCode(country.currency, normalizedLocal));
  }

  return [normalizedLocal, ...Array.from(currencies).filter((currency) => currency !== normalizedLocal).sort()];
}
