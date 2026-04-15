import { useEffect, useState, type FormEvent } from "react";
import { demoSmsSamples, demoTransactions } from "./lib/demo";
import { importAndroidSmsMessages, isAndroidNativePlatform, type AndroidSmsInboxMessage } from "./lib/android-sms";
import { buildAdvice, buildCategoryBreakdown, buildInsights, buildMonthlyTrend, buildWeeklyTrend, computeSummary, convertCurrency, formatMoney, normalizeAdviceType, normalizeCategory, parseSmsTransaction, projectSavings } from "./lib/finance";
import type { AdviceCard, CurrencyCode, ScreenKey, Transaction } from "./types";
import { AppShell } from "./ui/shell";
import { AuthScreen, PermissionScreen } from "./ui/auth";
import { Toast } from "./ui/shared";

type Session = {
  email: string;
  name: string;
  mode: "demo" | "local";
};

type Flash = {
  type: AdviceCard["type"] | "neutral";
  message: string;
};

type PersistedState = {
  session: Session | null;
  smsAccess: boolean;
  activeScreen: ScreenKey;
  transactions: Transaction[];
  smartSaveGoal: number;
  targetCurrency: CurrencyCode;
};

const STORAGE_KEY = "smartbudget-product-state-v1";
const DEFAULT_GOAL = 500;

function App() {
  const [state, setState] = useState<PersistedState>(() => loadInitialState());
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("student@smartbudget.app");
  const [password, setPassword] = useState("");
  const [smsDraft, setSmsDraft] = useState(demoSmsSamples[0]);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [aiAdvice, setAiAdvice] = useState<AdviceCard[] | null>(null);
  const [isAnalyzingSms, setIsAnalyzingSms] = useState(false);
  const [isRefreshingAdvice, setIsRefreshingAdvice] = useState(false);
  const [isImportingNativeSms, setIsImportingNativeSms] = useState(false);
  const isAndroidNative = isAndroidNativePlatform();

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage failures and keep the session functional.
    }
  }, [state]);

  useEffect(() => {
    if (!flash) {
      return;
    }

    const timer = window.setTimeout(() => setFlash(null), 3200);
    return () => window.clearTimeout(timer);
  }, [flash]);

  const summary = computeSummary(state.transactions);
  const categoryBreakdown = buildCategoryBreakdown(state.transactions);
  const monthlyTrend = buildMonthlyTrend(state.transactions, 6);
  const weeklyTrend = buildWeeklyTrend(state.transactions, 8);
  const insights = buildInsights(summary, state.transactions);
  const adviceCards = aiAdvice ?? buildAdvice(summary, state.transactions);
  const safeSavings = Math.max(summary.savings, 0);
  const protectedSavings = safeSavings * 0.6;
  const convertedSavings = convertCurrency(protectedSavings, state.targetCurrency);
  const projection = projectSavings(protectedSavings, Math.max(summary.cashFlow, 0), 12);
  const goalProgress = state.smartSaveGoal > 0 ? Math.max(0, Math.min(100, (safeSavings / state.smartSaveGoal) * 100)) : 0;

  function flashMessage(type: Flash["type"], message: string) {
    setFlash({ type, message });
  }

  function cloneDemoTransactions() {
    return demoTransactions.map((transaction) => ({ ...transaction }));
  }

  function loadDemoData(mode: "demo" | "local" = "demo") {
    setState((current) => ({
      ...current,
      session: current.session ?? buildSession(email, mode),
      smsAccess: true,
      activeScreen: "dashboard",
      transactions: current.transactions.length > 0 ? current.transactions : cloneDemoTransactions(),
    }));
    setAiAdvice(null);
    flashMessage("success", "Demo data unlocked and SmartBudget is ready.");
  }

  function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@") || !password.trim()) {
      flashMessage("warning", "Enter a valid email and password to continue.");
      return;
    }

    setState((current) => ({
      ...current,
      session: buildSession(trimmedEmail, "local"),
      smsAccess: false,
      activeScreen: "dashboard",
      transactions: current.transactions.length > 0 ? current.transactions : cloneDemoTransactions(),
    }));
    setAiAdvice(null);
    flashMessage("success", `${authMode === "signup" ? "Account created" : "Welcome back"} for ${trimmedEmail}.`);
  }

  async function handleAllowSmsAccess() {
    if (!isAndroidNative) {
      setState((current) => ({
        ...current,
        smsAccess: true,
        activeScreen: "dashboard",
        transactions: current.transactions.length > 0 ? current.transactions : cloneDemoTransactions(),
      }));
      setAiAdvice(null);
      flashMessage("success", "SMS access enabled. Import your first message now.");
      return;
    }

    setIsImportingNativeSms(true);

    try {
      const inboxMessages = await importAndroidSmsMessages(80);
      const importedTransactions = inboxMessages
        .map(convertAndroidSmsMessageToTransaction)
        .filter((transaction): transaction is Transaction => transaction !== null);

      if (importedTransactions.length === 0) {
        setState((current) => ({
          ...current,
          smsAccess: true,
          activeScreen: "dashboard",
        }));
        setAiAdvice(null);
        flashMessage("warning", "SMS permission granted, but no financial messages were found on this device.");
        return;
      }

      let addedCount = 0;
      setState((current) => {
        const mergedTransactions = mergeImportedTransactions(current.transactions, importedTransactions);
        addedCount = mergedTransactions.length - current.transactions.length;

        return {
          ...current,
          smsAccess: true,
          activeScreen: "dashboard",
          transactions: mergedTransactions,
        };
      });

      setAiAdvice(null);
      if (addedCount > 0) {
        flashMessage("success", `Imported ${addedCount} SMS transaction${addedCount === 1 ? "" : "s"} from your phone.`);
      } else {
        flashMessage("neutral", "Your inbox messages were already imported.");
      }
    } catch (error) {
      flashMessage("error", error instanceof Error ? error.message : "Unable to import SMS messages from your phone.");
    } finally {
      setIsImportingNativeSms(false);
    }
  }

  function handleSignOut() {
    setState((current) => ({
      ...current,
      session: null,
      smsAccess: false,
      activeScreen: "dashboard",
    }));
    setAiAdvice(null);
    setIsImportingNativeSms(false);
    flashMessage("neutral", "Signed out of SmartBudget.");
  }

  function updateScreen(nextScreen: ScreenKey) {
    setState((current) => ({ ...current, activeScreen: nextScreen }));
  }

  function updateGoal(value: number) {
    setState((current) => ({ ...current, smartSaveGoal: value }));
  }

  function updateTargetCurrency(value: CurrencyCode) {
    setState((current) => ({ ...current, targetCurrency: value }));
  }

  async function handleAnalyzeSms() {
    const parsed = parseSmsTransaction(smsDraft);
    if (!parsed) {
      flashMessage("warning", "Could not extract an amount from that SMS.");
      return;
    }

    setIsAnalyzingSms(true);
    let transaction = parsed;

    try {
      const response = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ smsText: smsDraft }),
      });

      if (response.ok) {
        const aiResult = await response.json();
        const aiAmount = Number(aiResult?.amount);
        const aiMerchant = typeof aiResult?.merchant === "string" ? aiResult.merchant.trim() : "";
        const aiCategory = typeof aiResult?.category === "string" ? normalizeCategory(aiResult.category) : transaction.category;

        if (Number.isFinite(aiAmount) && aiAmount > 0) {
          transaction = {
            ...transaction,
            amount: aiAmount,
            merchant: aiMerchant && aiMerchant !== "Unknown" ? aiMerchant : transaction.merchant,
            category: aiCategory,
          };
        }
      }
    } catch {
      // Local parsing is the fallback path when the AI endpoint is unavailable.
    } finally {
      setIsAnalyzingSms(false);
    }

    const imported = {
      ...transaction,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      rawSms: smsDraft,
      source: "sms" as const,
    };

    setState((current) => ({
      ...current,
      transactions: [imported, ...current.transactions],
      activeScreen: "transactions",
    }));
    setAiAdvice(null);
    flashMessage(
      "success",
      `Imported ${imported.merchant} · ${formatMoney(imported.amount, imported.currency)} as ${imported.category}.`,
    );
  }

  function deleteTransaction(id: string) {
    setState((current) => ({
      ...current,
      transactions: current.transactions.filter((transaction) => transaction.id !== id),
    }));
    setAiAdvice(null);
    flashMessage("neutral", "Transaction removed from the ledger.");
  }

  async function refreshAdvice() {
    const fallback = buildAdvice(summary, state.transactions);
    setIsRefreshingAdvice(true);

    try {
      const response = await fetch("/api/ai/advice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            summary,
            transactions: state.transactions,
            categoryBreakdown,
            monthlyTrend,
          },
        }),
      });

      if (response.ok) {
        const payload = await response.json();
        if (Array.isArray(payload) && payload.length > 0) {
          const cleaned = payload
            .map((card) => sanitizeAdviceCard(card))
            .filter((card): card is AdviceCard => card !== null)
            .slice(0, 3);

          if (cleaned.length > 0) {
            setAiAdvice(cleaned);
            flashMessage("success", "AI advice refreshed.");
            return;
          }
        }
      }
    } catch {
      // Fall through to the deterministic advice set.
    } finally {
      setIsRefreshingAdvice(false);
    }

    setAiAdvice(fallback);
    flashMessage("warning", "AI endpoint was unavailable, so SmartBudget used local advice.");
  }

  if (!state.session) {
    return (
      <div className="app-root">
        <AuthScreen
          mode={authMode}
          email={email}
          password={password}
          onModeChange={setAuthMode}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleAuthSubmit}
          onTryDemo={() => loadDemoData("demo")}
        />
        <Toast flash={flash} />
      </div>
    );
  }

  if (!state.smsAccess) {
    return (
      <div className="app-root">
        <PermissionScreen
          sampleSms={demoSmsSamples}
          onAllowSmsAccess={handleAllowSmsAccess}
          onUseDemoData={() => loadDemoData("demo")}
          isAndroidNative={isAndroidNative}
          isImportingNativeSms={isImportingNativeSms}
        />
        <Toast flash={flash} />
      </div>
    );
  }

  return (
    <div className="app-root">
      <AppShell
        session={state.session}
        activeScreen={state.activeScreen}
        summary={summary}
        transactions={state.transactions}
        isAndroidNative={isAndroidNative}
        smsDraft={smsDraft}
        setSmsDraft={setSmsDraft}
        goalProgress={goalProgress}
        safeSavings={safeSavings}
        protectedSavings={protectedSavings}
        convertedSavings={convertedSavings}
        projection={projection}
        targetCurrency={state.targetCurrency}
        smartSaveGoal={state.smartSaveGoal}
        isAnalyzingSms={isAnalyzingSms}
        isImportingNativeSms={isImportingNativeSms}
        isRefreshingAdvice={isRefreshingAdvice}
        adviceCards={adviceCards}
        insights={insights}
        onSelectScreen={updateScreen}
        onSignOut={handleSignOut}
        onRefreshAdvice={refreshAdvice}
        onAnalyzeSms={handleAnalyzeSms}
        onImportNativeSms={handleAllowSmsAccess}
        onUseDemoData={() => loadDemoData("demo")}
        onDeleteTransaction={deleteTransaction}
        onUpdateGoal={updateGoal}
        onUpdateTargetCurrency={updateTargetCurrency}
        onFillSampleSms={setSmsDraft}
      />
      <Toast flash={flash} />
    </div>
  );
}

function loadInitialState(): PersistedState {
  if (typeof window === "undefined") {
    return createDefaultState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultState();
    }

    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      session:
        parsed.session && typeof parsed.session.email === "string"
          ? {
              email: parsed.session.email,
              name: parsed.session.name || parsed.session.email.split("@")[0],
              mode: parsed.session.mode === "demo" ? "demo" : "local",
            }
          : null,
      smsAccess: Boolean(parsed.smsAccess),
      activeScreen: isScreenKey(parsed.activeScreen) ? parsed.activeScreen : "dashboard",
      transactions:
        Array.isArray(parsed.transactions) && parsed.transactions.length > 0
          ? (parsed.transactions as Transaction[]).map(normalizeTransactionSource)
          : cloneDemoTransactions(),
      smartSaveGoal: typeof parsed.smartSaveGoal === "number" ? parsed.smartSaveGoal : DEFAULT_GOAL,
      targetCurrency: parsed.targetCurrency === "USD" || parsed.targetCurrency === "EUR" ? parsed.targetCurrency : "USD",
    };
  } catch {
    return createDefaultState();
  }
}

function createDefaultState(): PersistedState {
  return {
    session: null,
    smsAccess: false,
    activeScreen: "dashboard",
    transactions: cloneDemoTransactions(),
    smartSaveGoal: DEFAULT_GOAL,
    targetCurrency: "USD",
  };
}

function cloneDemoTransactions() {
  return demoTransactions.map((transaction) => ({ ...transaction }));
}

function normalizeTransactionSource(transaction: Transaction): Transaction {
  if (transaction.source === "sms" || transaction.source === "manual") {
    return transaction;
  }

  return {
    ...transaction,
    source: "manual",
  };
}

function isScreenKey(value: unknown): value is ScreenKey {
  return value === "dashboard" || value === "transactions" || value === "analysis" || value === "save" || value === "advice";
}

function buildSession(email: string, mode: Session["mode"]): Session {
  const name = email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return {
    email,
    name: name || "SmartBudget User",
    mode,
  };
}

function sanitizeAdviceCard(card: unknown): AdviceCard | null {
  if (!card || typeof card !== "object") {
    return null;
  }

  const value = card as Record<string, unknown>;
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const description = typeof value.description === "string" ? value.description.trim() : "";
  if (!title || !description) {
    return null;
  }

  return {
    type: normalizeAdviceType(typeof value.type === "string" ? value.type : "warning"),
    title,
    description,
  };
}

function convertAndroidSmsMessageToTransaction(message: AndroidSmsInboxMessage): Transaction | null {
  const parsed = parseSmsTransaction(message.body);
  if (!parsed) {
    return null;
  }

  const date = Number.isFinite(message.date) ? new Date(message.date).toISOString() : parsed.date;

  return {
    ...parsed,
    id: `sms-${message.id || crypto.randomUUID()}`,
    date,
    rawSms: message.body.trim(),
    source: "sms",
  };
}

function mergeImportedTransactions(existing: Transaction[], imported: Transaction[]) {
  const seenSms = new Set(
    existing
      .map((transaction) => transaction.rawSms?.trim())
      .filter((value): value is string => Boolean(value)),
  );

  const merged: Transaction[] = [];

  for (const transaction of imported) {
    const rawSms = transaction.rawSms?.trim();
    if (rawSms && seenSms.has(rawSms)) {
      continue;
    }

    if (rawSms) {
      seenSms.add(rawSms);
    }

    merged.push(transaction);
  }

  return [...merged, ...existing];
}

export default App;
