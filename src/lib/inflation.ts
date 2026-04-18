import type { BalancePurchasingPowerShift } from "../types";

function isBalancePurchasingPowerShift(value: unknown): value is BalancePurchasingPowerShift {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.countryCode === "string" &&
    typeof candidate.countryName === "string" &&
    typeof candidate.inflationPct === "number" &&
    typeof candidate.purchasingPowerShiftPct === "number" &&
    typeof candidate.isIncrease === "boolean" &&
    (candidate.latestMonth === null || typeof candidate.latestMonth === "string") &&
    (candidate.source === "worldbank-gem" || candidate.source === "bundled")
  );
}

export async function fetchBalancePurchasingPowerShift(countryCode: string): Promise<BalancePurchasingPowerShift | null> {
  const normalizedCountryCode = countryCode.trim().toUpperCase();

  if (!normalizedCountryCode) {
    return null;
  }

  const response = await fetch(`/api/inflation/current?country=${encodeURIComponent(normalizedCountryCode)}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load live inflation data.");
  }

  const payload = await response.json();
  return isBalancePurchasingPowerShift(payload) ? payload : null;
}
