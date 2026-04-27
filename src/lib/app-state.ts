import type { CurrencyCode, EmailScannerConfig, ScreenKey, Transaction, SmartSavePlusState } from "../types";
import { normalizeCurrencyCode } from "./exchange-rates";
import { normalizeCategory } from "./finance";

const DEVICE_STATE_KEY = "smartbudget-device-state-v2";

export const DEFAULT_SMART_SAVE_GOAL = 500;

export type DeviceState = {
  smsAccess: boolean;
  smsInboxCursorDate: number;
  activeScreen: ScreenKey;
  emailScanner: EmailScannerConfig;
};

export type CloudState = {
  transactions: Transaction[];
  smartSaveGoal: number;
  targetCurrency: CurrencyCode;
  smartSavePlus: SmartSavePlusState;
};

export function createDefaultDeviceState(): DeviceState {
  return {
    smsAccess: false,
    smsInboxCursorDate: 0,
    activeScreen: "dashboard",
    emailScanner: createDefaultEmailScannerConfig(),
  };
}

export function createDefaultEmailScannerConfig(): EmailScannerConfig {
  return {
    emailAddress: "",
    host: "",
    port: 993,
    mailbox: "INBOX",
    lastSeenUid: 0,
    uidValidity: "",
    autoSyncEnabled: false,
    pollingIntervalMinutes: 5,
  };
}

export function createDefaultCloudState(): CloudState {
  return {
    transactions: [],
    smartSaveGoal: DEFAULT_SMART_SAVE_GOAL,
    targetCurrency: "USD",
    smartSavePlus: {
      protectedHoldings: [],
      currencyTransactions: [],
      totalProtectedValue: 0,
    },
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
      smsInboxCursorDate: normalizeSmsInboxCursor(parsed.smsInboxCursorDate),
      activeScreen: isScreenKey(parsed.activeScreen) ? parsed.activeScreen : "dashboard",
      emailScanner: normalizeEmailScannerConfig(parsed.emailScanner),
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
    targetCurrency: normalizeCurrencyCode(typeof parsed.targetCurrency === "string" ? parsed.targetCurrency : "USD", "USD"),
    smartSavePlus: normalizeSmartSavePlusState(parsed.smartSavePlus),
  };
}

function normalizeSmartSavePlusState(value: unknown): SmartSavePlusState {
  if (!value || typeof value !== "object") {
    return createDefaultCloudState().smartSavePlus;
  }

  const parsed = value as Partial<SmartSavePlusState>;

  return {
    protectedHoldings: Array.isArray(parsed.protectedHoldings) ? parsed.protectedHoldings : [],
    currencyTransactions: Array.isArray(parsed.currencyTransactions) ? parsed.currencyTransactions : [],
    totalProtectedValue: typeof parsed.totalProtectedValue === "number" ? parsed.totalProtectedValue : 0,
  };
}

function normalizeEmailScannerConfig(value: unknown): EmailScannerConfig {
  const fallback = createDefaultEmailScannerConfig();

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const parsed = value as Partial<EmailScannerConfig>;

  return {
    emailAddress: typeof parsed.emailAddress === "string" ? parsed.emailAddress.trim() : fallback.emailAddress,
    host: typeof parsed.host === "string" ? parsed.host.trim() : fallback.host,
    port: Number.isFinite(Number(parsed.port)) && Number(parsed.port) > 0 ? Number(parsed.port) : fallback.port,
    mailbox: typeof parsed.mailbox === "string" && parsed.mailbox.trim() ? parsed.mailbox.trim() : fallback.mailbox,
    lastSeenUid: Number.isFinite(Number(parsed.lastSeenUid)) && Number(parsed.lastSeenUid) > 0 ? Math.floor(Number(parsed.lastSeenUid)) : 0,
    uidValidity: typeof parsed.uidValidity === "string" ? parsed.uidValidity.trim() : fallback.uidValidity,
    autoSyncEnabled: Boolean(parsed.autoSyncEnabled),
    pollingIntervalMinutes: normalizeEmailPollingInterval(parsed.pollingIntervalMinutes),
  };
}

function normalizeEmailPollingInterval(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return createDefaultEmailScannerConfig().pollingIntervalMinutes;
  }

  return Math.max(2, Math.min(30, Math.round(parsed)));
}

function normalizeSmsInboxCursor(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.floor(parsed);
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
  if (transaction.source === "sms" || transaction.source === "email" || transaction.source === "manual") {
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

  const currency = normalizeCurrencyCode(typeof parsed.currency === "string" ? parsed.currency : "TRY", "TRY");
  const category = typeof parsed.category === "string" ? normalizeCategory(parsed.category) : "Other";
  const kind = parsed.kind === "income" || parsed.kind === "expense" ? parsed.kind : "expense";
  const source = parsed.source === "sms" || parsed.source === "email" ? parsed.source : "manual";

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
    rawEmail: typeof parsed.rawEmail === "string" && parsed.rawEmail.trim() ? parsed.rawEmail.trim() : undefined,
    emailSubject: typeof parsed.emailSubject === "string" && parsed.emailSubject.trim() ? parsed.emailSubject.trim() : undefined,
    sourceMessageId: typeof parsed.sourceMessageId === "string" && parsed.sourceMessageId.trim() ? parsed.sourceMessageId.trim() : undefined,
  };
}
