import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Session as SupabaseSession } from "@supabase/supabase-js";
import { demoSmsSamples, demoTransactions } from "./lib/demo";
import { importAndroidSmsMessages, isAndroidNativePlatform, type AndroidSmsInboxMessage } from "./lib/android-sms";
import {
  DEFAULT_SMART_SAVE_GOAL,
  createDefaultCloudState,
  loadDeviceState,
  saveDeviceState,
  type CloudState,
  type DeviceState,
} from "./lib/app-state";
import { loadCloudState, saveCloudState } from "./lib/cloud-store";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import {
  buildAdvice,
  buildCategoryBreakdown,
  buildInsights,
  buildMonthlyTrend,
  buildWeeklyTrend,
  computeSummary,
  convertCurrency,
  formatMoney,
  normalizeAdviceType,
  normalizeCategory,
  parseSmsTransaction,
  projectSavings,
} from "./lib/finance";
import type { AdviceCard, CurrencyCode, ScreenKey, Transaction } from "./types";
import { AppShell } from "./ui/shell";
import { AuthScreen, PermissionScreen } from "./ui/auth";
import { Panel, Toast } from "./ui/shared";

type Session = {
  userId: string;
  email: string;
  name: string;
  mode: "cloud" | "demo";
};

type Flash = {
  type: AdviceCard["type"] | "neutral";
  message: string;
};

function App() {
  const [deviceState, setDeviceState] = useState<DeviceState>(() => loadDeviceState());
  const [cloudState, setCloudState] = useState<CloudState>(() => createDefaultCloudState());
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("student@smartbudget.app");
  const [password, setPassword] = useState("");
  const [smsDraft, setSmsDraft] = useState(demoSmsSamples[0]);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [aiAdvice, setAiAdvice] = useState<AdviceCard[] | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAnalyzingSms, setIsAnalyzingSms] = useState(false);
  const [isRefreshingAdvice, setIsRefreshingAdvice] = useState(false);
  const [isImportingNativeSms, setIsImportingNativeSms] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(isSupabaseConfigured));
  const isAndroidNative = isAndroidNativePlatform();
  const appliedCloudUserIdRef = useRef<string | null>(null);
  const isHydratingCloudRef = useRef(false);
  const skipNextCloudSaveRef = useRef(false);

  useEffect(() => {
    saveDeviceState(deviceState);
  }, [deviceState]);

  useEffect(() => {
    if (!supabase) {
      setIsBootstrapping(false);
      return;
    }

    let cancelled = false;

    const hydrateFromSession = async (nextSession: SupabaseSession | null) => {
      if (cancelled) {
        return;
      }

      if (!nextSession?.user?.id) {
        appliedCloudUserIdRef.current = null;
        isHydratingCloudRef.current = false;
        skipNextCloudSaveRef.current = true;
        setSession(null);
        setCloudState(createDefaultCloudState());
        setAiAdvice(null);
        setPassword("");
        setIsBootstrapping(false);
        return;
      }

      const nextAccount = buildSessionFromSupabase(nextSession);
      isHydratingCloudRef.current = true;
      skipNextCloudSaveRef.current = true;
      setSession(nextAccount);

      if (appliedCloudUserIdRef.current === nextSession.user.id) {
        setIsBootstrapping(false);
        return;
      }

      appliedCloudUserIdRef.current = nextSession.user.id;
      setIsBootstrapping(true);
      setCloudState(createDefaultCloudState());

      try {
        const loaded = await loadCloudState(nextSession.user.id);
        const hydrated = loaded ?? createDefaultCloudState();

        if (!loaded) {
          await saveCloudState(nextSession.user.id, hydrated);
        }

        if (cancelled) {
          return;
        }

        skipNextCloudSaveRef.current = true;
        setCloudState(hydrated);
        setAiAdvice(null);
      } catch (error) {
        if (!cancelled) {
          skipNextCloudSaveRef.current = true;
          setCloudState(createDefaultCloudState());
          flashMessage("error", error instanceof Error ? error.message : "Unable to load your saved budget.");
        }
      } finally {
        if (!cancelled) {
          isHydratingCloudRef.current = false;
          setIsBootstrapping(false);
        }
      }
    };

    void supabase.auth.getSession().then(({ data }) => {
      void hydrateFromSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void hydrateFromSession(nextSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session || session.mode !== "cloud") {
      return;
    }

    if (isHydratingCloudRef.current) {
      return;
    }

    if (skipNextCloudSaveRef.current) {
      skipNextCloudSaveRef.current = false;
      return;
    }

    let cancelled = false;

    void saveCloudState(session.userId, cloudState).catch((error) => {
      if (!cancelled) {
        flashMessage("error", error instanceof Error ? error.message : "Unable to sync your budget to the cloud.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [cloudState, session]);

  useEffect(() => {
    if (!flash) {
      return;
    }

    const timer = window.setTimeout(() => setFlash(null), 3200);
    return () => window.clearTimeout(timer);
  }, [flash]);

  const summary = computeSummary(cloudState.transactions);
  const categoryBreakdown = buildCategoryBreakdown(cloudState.transactions);
  const monthlyTrend = buildMonthlyTrend(cloudState.transactions, 6);
  const weeklyTrend = buildWeeklyTrend(cloudState.transactions, 8);
  const insights = buildInsights(summary, cloudState.transactions);
  const adviceCards = aiAdvice ?? buildAdvice(summary, cloudState.transactions);
  const safeSavings = Math.max(summary.savings, 0);
  const protectedSavings = safeSavings * 0.6;
  const convertedSavings = convertCurrency(protectedSavings, cloudState.targetCurrency);
  const projection = projectSavings(protectedSavings, Math.max(summary.cashFlow, 0), 12);
  const goalProgress =
    cloudState.smartSaveGoal > 0 ? Math.max(0, Math.min(100, (safeSavings / cloudState.smartSaveGoal) * 100)) : 0;

  function flashMessage(type: Flash["type"], message: string) {
    setFlash({ type, message });
  }

  function loadDemoData() {
    const demoCloudState: CloudState = {
      transactions: cloneDemoTransactions(),
      smartSaveGoal: DEFAULT_SMART_SAVE_GOAL,
      targetCurrency: "USD",
    };

    appliedCloudUserIdRef.current = null;
    isHydratingCloudRef.current = false;
    skipNextCloudSaveRef.current = true;
    setSession(buildDemoSession(email.trim() || "demo@smartbudget.app"));
    setCloudState(demoCloudState);
    setDeviceState((current) => ({
      ...current,
      smsAccess: true,
      activeScreen: "dashboard",
    }));
    setAiAdvice(null);
    setPassword("");
    flashMessage("success", "Demo data loaded. Sign in to sync your own ledger to the cloud.");
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedEmail.includes("@") || !trimmedPassword) {
      flashMessage("warning", "Enter a valid email and password to continue.");
      return;
    }

    if (!supabase) {
      flashMessage("error", "Configure Supabase to enable real sign in and cloud storage.");
      return;
    }

    setIsAuthenticating(true);

    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          options: {
            data: {
              name: displayNameFromEmail(trimmedEmail),
            },
          },
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          flashMessage("success", "Account created. Loading your cloud budget...");
        } else {
          flashMessage("neutral", "Check your email to confirm the account, then sign in again.");
        }
        setPassword("");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });

        if (error) {
          throw error;
        }

        flashMessage("success", "Signed in. Loading your cloud budget...");
        setPassword("");
      }
    } catch (error) {
      flashMessage("error", error instanceof Error ? error.message : "Unable to authenticate.");
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function handleAllowSmsAccess() {
    if (!isAndroidNative) {
      flashMessage("neutral", "SMS inbox access is only available on Android. Use demo SMS or paste a message on the dashboard.");
      return;
    }

    setIsImportingNativeSms(true);

    try {
      const inboxMessages = await importAndroidSmsMessages(80);
      const importedTransactions = inboxMessages
        .map(convertAndroidSmsMessageToTransaction)
        .filter((transaction): transaction is Transaction => transaction !== null);

      setDeviceState((current) => ({
        ...current,
        smsAccess: true,
        activeScreen: "dashboard",
      }));

      if (importedTransactions.length === 0) {
        setAiAdvice(null);
        flashMessage("warning", "SMS permission granted, but no financial messages were found on this device.");
        return;
      }

      let addedCount = 0;
      setCloudState((current) => {
        const merged = mergeTransactions(current.transactions, importedTransactions);
        addedCount = merged.addedCount;
        if (merged.addedCount === 0) {
          return current;
        }
        return {
          ...current,
          transactions: merged.transactions,
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

  async function handleSignOut() {
    if (session?.mode === "cloud" && supabase) {
      try {
        await supabase.auth.signOut();
        flashMessage("neutral", "Signed out of SmartBudget.");
      } catch (error) {
        flashMessage("error", error instanceof Error ? error.message : "Unable to sign out.");
      }
      return;
    }

    appliedCloudUserIdRef.current = null;
    isHydratingCloudRef.current = false;
    skipNextCloudSaveRef.current = true;
    setSession(null);
    setCloudState(createDefaultCloudState());
    setAiAdvice(null);
    setPassword("");
    setDeviceState((current) => ({
      ...current,
      activeScreen: "dashboard",
    }));
    flashMessage("neutral", "Signed out of SmartBudget.");
  }

  function updateScreen(nextScreen: ScreenKey) {
    setDeviceState((current) => ({ ...current, activeScreen: nextScreen }));
  }

  function updateGoal(value: number) {
    setCloudState((current) => ({ ...current, smartSaveGoal: value }));
  }

  function updateTargetCurrency(value: CurrencyCode) {
    setCloudState((current) => ({ ...current, targetCurrency: value }));
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
      rawSms: smsDraft.trim(),
      source: "sms" as const,
    };

    let addedCount = 0;
    setCloudState((current) => {
      const merged = mergeTransactions(current.transactions, [imported]);
      addedCount = merged.addedCount;
      if (merged.addedCount === 0) {
        return current;
      }
      return {
        ...current,
        transactions: merged.transactions,
      };
    });

    if (addedCount === 0) {
      flashMessage("neutral", "This SMS is already in your ledger.");
      return;
    }

    setAiAdvice(null);
    setDeviceState((current) => ({ ...current, activeScreen: "transactions" }));
    flashMessage("success", `Imported ${imported.merchant} · ${formatMoney(imported.amount, imported.currency)} as ${imported.category}.`);
  }

  function deleteTransaction(id: string) {
    setCloudState((current) => ({
      ...current,
      transactions: current.transactions.filter((transaction) => transaction.id !== id),
    }));
    setAiAdvice(null);
    flashMessage("neutral", "Transaction removed from the ledger.");
  }

  async function refreshAdvice() {
    const fallback = buildAdvice(summary, cloudState.transactions);
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
            transactions: cloudState.transactions,
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

  if (isBootstrapping) {
    return (
      <div className="app-root app-root--scroll">
        <LoadingScreen />
        <Toast flash={flash} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app-root app-root--scroll">
        <AuthScreen
          mode={authMode}
          email={email}
          password={password}
          onModeChange={setAuthMode}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleAuthSubmit}
          onTryDemo={loadDemoData}
          cloudReady={isSupabaseConfigured}
          isAuthenticating={isAuthenticating}
        />
        <Toast flash={flash} />
      </div>
    );
  }

  if (isAndroidNative && !deviceState.smsAccess) {
    return (
      <div className="app-root app-root--scroll">
        <PermissionScreen
          sampleSms={demoSmsSamples}
          onAllowSmsAccess={handleAllowSmsAccess}
          onUseDemoData={loadDemoData}
          isAndroidNative={isAndroidNative}
          isImportingNativeSms={isImportingNativeSms}
        />
        <Toast flash={flash} />
      </div>
    );
  }

  return (
    <div className="app-root app-root--shell">
      <AppShell
        session={session}
        activeScreen={deviceState.activeScreen}
        summary={summary}
        transactions={cloudState.transactions}
        isAndroidNative={isAndroidNative}
        smsDraft={smsDraft}
        setSmsDraft={setSmsDraft}
        goalProgress={goalProgress}
        safeSavings={safeSavings}
        protectedSavings={protectedSavings}
        convertedSavings={convertedSavings}
        projection={projection}
        targetCurrency={cloudState.targetCurrency}
        smartSaveGoal={cloudState.smartSaveGoal}
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
        onUseDemoData={loadDemoData}
        onDeleteTransaction={deleteTransaction}
        onUpdateGoal={updateGoal}
        onUpdateTargetCurrency={updateTargetCurrency}
        onFillSampleSms={setSmsDraft}
      />
      <Toast flash={flash} />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="auth-layout loading-layout">
      <Panel title="SmartBudget" subtitle="Syncing your cloud account" className="hero-panel auth-hero">
        <div className="hero-badge">SmartBudget</div>
        <h1>Loading your saved budget.</h1>
        <p>Fetching your cloud account, then preparing the dashboard and native SMS flow.</p>
        <div className="hero-preview">
          <div className="hero-preview__card">
            <span>Status</span>
            <strong>Connecting</strong>
          </div>
          <div className="hero-preview__card hero-preview__card--accent">
            <span>Storage</span>
            <strong>Supabase</strong>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function cloneDemoTransactions() {
  return demoTransactions.map((transaction) => ({ ...transaction }));
}

function buildDemoSession(email: string): Session {
  return {
    userId: "demo",
    email,
    name: "Demo User",
    mode: "demo",
  };
}

function buildSessionFromSupabase(session: SupabaseSession): Session {
  const email = session.user.email?.trim().toLowerCase() || "student@smartbudget.app";
  const metadataName = typeof session.user.user_metadata?.name === "string" ? session.user.user_metadata.name.trim() : "";

  return {
    userId: session.user.id,
    email,
    name: metadataName || displayNameFromEmail(email),
    mode: "cloud",
  };
}

function displayNameFromEmail(email: string) {
  const prefix = email.split("@")[0] ?? "smartbudget user";
  const name = prefix
    .replace(/[._-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return name || "SmartBudget User";
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

function mergeTransactions(existing: Transaction[], incoming: Transaction[]) {
  const seenSms = new Set(
    existing
      .map((transaction) => transaction.rawSms?.trim())
      .filter((value): value is string => Boolean(value)),
  );
  const seenIds = new Set(existing.map((transaction) => transaction.id));
  const merged: Transaction[] = [];

  for (const transaction of incoming) {
    const rawSms = transaction.rawSms?.trim();
    if (seenIds.has(transaction.id) || (rawSms && seenSms.has(rawSms))) {
      continue;
    }

    if (rawSms) {
      seenSms.add(rawSms);
    }

    seenIds.add(transaction.id);
    merged.push(transaction);
  }

  return {
    transactions: [...merged, ...existing],
    addedCount: merged.length,
  };
}

export default App;
