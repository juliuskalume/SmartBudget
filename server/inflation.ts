import { COUNTRY_OPTIONS, DEFAULT_COUNTRY_CODE, type CountryOption } from "../src/lib/country-data.js";
import type { BalancePurchasingPowerShift } from "../src/types.js";

const WORLD_BANK_API_BASE_URL = "https://api.worldbank.org/v2";
const WORLD_BANK_GEM_SOURCE_ID = "15";
const WORLD_BANK_GEM_CPI_INDICATOR = "CPTOTNSXN";
const GEM_CACHE_MS = 6 * 60 * 60 * 1000;
const GEM_MONTH_WINDOW = 18;

type GemObservation = {
  date: string;
  value: number;
};

type GemApiRow = {
  date?: unknown;
  value?: unknown;
};

const countryMap = new Map(COUNTRY_OPTIONS.map((country) => [country.code, country]));
const gemCache = new Map<string, { expiresAt: number; observations: GemObservation[] }>();
const gemRequestsInFlight = new Map<string, Promise<GemObservation[]>>();

export async function buildBalancePurchasingPowerShift(countryCode?: string | null): Promise<BalancePurchasingPowerShift | null> {
  const country = getCountryByCode(countryCode);

  try {
    const observations = await loadGemObservations(country.iso3);
    const liveShift = buildShiftFromGem(country, observations);

    if (liveShift) {
      return liveShift;
    }
  } catch {
    // Fall back to the bundled country snapshot if GEM is temporarily unavailable.
  }

  return buildShiftFromBundledData(country);
}

async function loadGemObservations(iso3: string) {
  const cached = gemCache.get(iso3);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.observations;
  }

  const existingRequest = gemRequestsInFlight.get(iso3);
  if (existingRequest) {
    return existingRequest;
  }

  const request = fetchGemObservations(iso3)
    .then((observations) => {
      gemCache.set(iso3, {
        expiresAt: Date.now() + GEM_CACHE_MS,
        observations,
      });
      return observations;
    })
    .finally(() => {
      gemRequestsInFlight.delete(iso3);
    });

  gemRequestsInFlight.set(iso3, request);
  return request;
}

async function fetchGemObservations(iso3: string): Promise<GemObservation[]> {
  const url = new URL(`${WORLD_BANK_API_BASE_URL}/country/${encodeURIComponent(iso3)}/indicator/${WORLD_BANK_GEM_CPI_INDICATOR}`);
  url.search = new URLSearchParams({
    format: "json",
    source: WORLD_BANK_GEM_SOURCE_ID,
    date: buildGemDateRange(),
    per_page: "120",
  }).toString();

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; SmartBudget/1.0; +https://hamid-smart-budget.vercel.app)",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`World Bank GEM request failed (${response.status}).`);
  }

  const payload = (await response.json()) as unknown;
  const rows = Array.isArray(payload) && Array.isArray(payload[1]) ? (payload[1] as GemApiRow[]) : [];

  return rows
    .map((row) => ({
      date: typeof row.date === "string" ? row.date.trim() : "",
      value: Number(row.value),
    }))
    .filter((row) => /^\d{4}M\d{2}$/.test(row.date) && Number.isFinite(row.value) && row.value > 0)
    .sort((left, right) => right.date.localeCompare(left.date));
}

function buildShiftFromGem(country: CountryOption, observations: GemObservation[]): BalancePurchasingPowerShift | null {
  const [latest, previous] = observations;

  if (!latest || !previous || previous.value <= 0) {
    return null;
  }

  const inflationPct = ((latest.value - previous.value) / previous.value) * 100;
  if (!Number.isFinite(inflationPct)) {
    return null;
  }

  return buildShift(country, normalizeGemMonth(latest.date), inflationPct, "worldbank-gem");
}

function buildShiftFromBundledData(country: CountryOption): BalancePurchasingPowerShift | null {
  if (country.latestMonthlyInflationPct === null) {
    return null;
  }

  return buildShift(country, country.latestInflationMonth, country.latestMonthlyInflationPct, "bundled");
}

function buildShift(
  country: CountryOption,
  latestMonth: string | null,
  inflationPct: number,
  source: BalancePurchasingPowerShift["source"],
): BalancePurchasingPowerShift {
  return {
    countryCode: country.code,
    countryName: country.name,
    latestMonth: formatInflationMonth(latestMonth),
    inflationPct,
    purchasingPowerShiftPct: -inflationPct,
    isIncrease: inflationPct <= 0,
    source,
  };
}

function buildGemDateRange() {
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - GEM_MONTH_WINDOW, 1));
  return `${formatGemMonthForQuery(start)}:${formatGemMonthForQuery(end)}`;
}

function formatGemMonthForQuery(value: Date) {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  return `${year}M${month}`;
}

function normalizeGemMonth(value: string) {
  const match = value.match(/^(\d{4})M(\d{2})$/);
  return match ? `${match[1]}-${match[2]}` : null;
}

function formatInflationMonth(month: string | null) {
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

function getCountryByCode(code?: string | null) {
  const normalized = typeof code === "string" ? code.trim().toUpperCase() : "";
  return countryMap.get(normalized) ?? countryMap.get(DEFAULT_COUNTRY_CODE) ?? COUNTRY_OPTIONS[0];
}
