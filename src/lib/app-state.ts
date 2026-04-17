import type { CurrencyCode, ScreenKey, Transaction } from "../types";

const DEVICE_STATE_KEY = "smartbudget-device-state-v2";

export const DEFAULT_SMART_SAVE_GOAL = 500;

export type DeviceState = {
  smsAccess: boolean;
  activeScreen: ScreenKey;
};

export type CloudState = {
  transactions: Transaction[];
  smartSaveGoal: number;
  targetCurrency: CurrencyCode;
};

export function createDefaultDeviceState(): DeviceState {
  return {
    smsAccess: false,
    activeScreen: "dashboard",
  };
}

export function createDefaultCloudState(): CloudState {
  return {
    transactions: [],
    smartSaveGoal: DEFAULT_SMART_SAVE_GOAL,
    targetCurrency: "USD",
  };
}

export function loadDeviceState(): DeviceState {
  if (typeof window === "undefined") {
    return createDefaultDeviceState();
  }

  try {
    const raw = window.localStorage.getItem(DEVICE_STATE_KEY);
    if (!raw) {
      return createDefaultDeviceState();
    }

    const parsed = JSON.parse(raw) as Partial<DeviceState>;
    return {
      smsAccess: Boolean(parsed.smsAccess),
      activeScreen: isScreenKey(parsed.activeScreen) ? parsed.activeScreen : "dashboard",
    };
  } catch {
    return createDefaultDeviceState();
  }
}

export function saveDeviceState(state: DeviceState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(DEVICE_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures. The app can still run with in-memory state.
  }
}

export function normalizeCloudState(value: unknown): CloudState {
  if (!value || typeof value !== "object") {
    return createDefaultCloudState();
  }

  const parsed = value as Partial<CloudState>;
  return {
    transactions: Array.isArray(parsed.transactions)
      ? parsed.transactions
          .map((transaction) => normalizeTransaction(transaction))
          .filter((transaction): transaction is Transaction => transaction !== null)
      : [],
    smartSaveGoal: typeof parsed.smartSaveGoal === "number" ? parsed.smartSaveGoal : DEFAULT_SMART_SAVE_GOAL,
    targetCurrency: parsed.targetCurrency === "USD" || parsed.targetCurrency === "EUR" ? parsed.targetCurrency : "USD",
  };
}

export function isScreenKey(value: unknown): value is ScreenKey {
  return (
    value === "dashboard" ||
    value === "transactions" ||
    value === "analysis" ||
    value === "save" ||
    value === "advice" ||
    value === "profile"
  );
}

export function normalizeTransactionSource(transaction: Transaction): Transaction {
  if (transaction.source === "sms" || transaction.source === "manual") {
    return transaction;
  }

  return {
    ...transaction,
    source: "manual",
  };
}

function normalizeTransaction(value: unknown): Transaction | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const parsed = value as Partial<Transaction>;
  const merchant = typeof parsed.merchant === "string" && parsed.merchant.trim() ? parsed.merchant.trim() : "Unknown Merchant";
  const amount = Number(parsed.amount);

  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  const currency = parsed.currency === "USD" || parsed.currency === "EUR" ? parsed.currency : "TRY";
  const category =
    parsed.category === "Supermarket" ||
    parsed.category === "Transport" ||
    parsed.category === "Entertainment" ||
    parsed.category === "Bills" ||
    parsed.category === "Education" ||
    parsed.category === "Other"
      ? parsed.category
      : "Other";
  const kind = parsed.kind === "income" || parsed.kind === "expense" ? parsed.kind : "expense";
  const source = parsed.source === "sms" ? "sms" : "manual";

  return {
    id: typeof parsed.id === "string" && parsed.id.trim() ? parsed.id : crypto.randomUUID(),
    date: typeof parsed.date === "string" && parsed.date.trim() ? parsed.date : new Date().toISOString(),
    merchant,
    amount,
    currency,
    category,
    kind,
    source,
    rawSms: typeof parsed.rawSms === "string" && parsed.rawSms.trim() ? parsed.rawSms.trim() : undefined,
  };
}
