import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Session as SupabaseSession } from "@supabase/supabase-js";
import { demoTransactions } from "./lib/demo";
import {
  consumePendingAndroidSmsMessages,
  importAndroidSmsMessages,
  isAndroidNativePlatform,
  subscribeToAndroidSmsMessages,
  type AndroidSmsInboxMessage,
} from "./lib/android-sms";
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
import type { AdviceCard, CurrencyCode, ManualTransactionDraft, ScreenKey, Transaction } from "./types";
import { AppShell } from "./ui/shell";
import { AuthScreen, PermissionScreen } from "./ui/auth";
import { Panel, Toast } from "./ui/shared";

type Session = {
  userId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  mode: "cloud" | "demo";
};

type Flash = {
  type: AdviceCard["type"] | "neutral";
  message: string;
};

type SmsClassification = {
  isTransaction: boolean;
  merchant: string;
  amount: number;
  category: Transaction["category"];
  kind: Transaction["kind"];
  currency: CurrencyCode;
};

const SUPPORT_EMAIL = "sentira.official@gmail.com";
const APP_SHARE_MESSAGE = "Hey, I use SmartBudget to auto track and manage my finances. You can try it too at https://hamid-smart-budget.vercel.app";

function App() {
  const [deviceState, setDeviceState] = useState<DeviceState>(() => loadDeviceState());
  const [cloudState, setCloudState] = useState<CloudState>(() => createDefaultCloudState());
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("student@smartbudget.app");
  const [password, setPassword] = useState("");
  const [flash, setFlash] = useState<Flash | null>(null);
  const [aiAdvice, setAiAdvice] = useState<AdviceCard[] | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isRefreshingAdvice, setIsRefreshingAdvice] = useState(false);
  const [isImportingNativeSms, setIsImportingNativeSms] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
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

  useEffect(() => {
    if (!isAndroidNative || !deviceState.smsAccess || !session) {
      return;
    }

    let cancelled = false;
    const subscription = subscribeToAndroidSmsMessages((message) => {
      void ingestAndroidSmsMessages([message], { notifyOnImport: false, notifyWhenIgnored: false, notifyIfDuplicate: false });
    });

    const drainPending = async () => {
      try {
        const pending = await consumePendingAndroidSmsMessages();
        if (!cancelled && pending.length > 0) {
          await ingestAndroidSmsMessages(pending, { notifyOnImport: false, notifyWhenIgnored: false, notifyIfDuplicate: false });
        }
      } catch {
        // Ignore background drain errors here; inbox import remains available.
      }
    };

    const interval = window.setInterval(() => {
      void drainPending();
    }, 15000);

    const handleForeground = () => {
      if (document.visibilityState === "visible") {
        void drainPending();
      }
    };

    window.addEventListener("focus", handleForeground);
    document.addEventListener("visibilitychange", handleForeground);
    void drainPending();

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleForeground);
      document.removeEventListener("visibilitychange", handleForeground);
      void Promise.resolve(subscription).then((listener) => listener?.remove());
    };
  }, [deviceState.smsAccess, isAndroidNative, session]);

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

  function clearSessionState() {
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
    const emailRedirectTo = getAuthRedirectUrl();

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
            ...(emailRedirectTo ? { emailRedirectTo } : {}),
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
      flashMessage("neutral", "Automatic SMS sync is only available in the Android app. Use manual debit or credit entry here.");
      return;
    }

    setIsImportingNativeSms(true);

    try {
      const inboxMessages = await importAndroidSmsMessages(80);

      setDeviceState((current) => ({
        ...current,
        smsAccess: true,
        activeScreen: "dashboard",
      }));

      const outcome = await ingestAndroidSmsMessages(inboxMessages, {
        notifyOnImport: false,
        notifyWhenIgnored: false,
        notifyIfDuplicate: false,
      });

      if (outcome.addedCount > 0) {
        flashMessage(
          "success",
          `Automatic SMS sync is enabled. Imported ${outcome.addedCount} transaction${outcome.addedCount === 1 ? "" : "s"} from existing bank messages.`,
        );
        return;
      }

      if (outcome.duplicateCount > 0) {
        flashMessage("neutral", "Automatic SMS sync is enabled. Existing bank messages were already in your ledger.");
        return;
      }

      flashMessage("warning", "Automatic SMS sync is enabled, but no bank transaction messages were detected yet.");
    } catch (error) {
      flashMessage("error", error instanceof Error ? error.message : "Unable to enable automatic SMS sync on this device.");
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

    clearSessionState();
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

  async function saveProfileDetails(input: { name: string; email: string; avatarUrl: string }) {
    if (!session) {
      return false;
    }

    const nextName = input.name.trim();
    const nextEmail = input.email.trim().toLowerCase();
    const nextAvatarUrl = input.avatarUrl.trim();
    const normalizedAvatarUrl = nextAvatarUrl || null;

    if (!nextName) {
      flashMessage("warning", "Name cannot be empty.");
      return false;
    }

    if (!nextEmail || !nextEmail.includes("@")) {
      flashMessage("warning", "Enter a valid email address.");
      return false;
    }

    if (session.mode === "demo") {
      setSession((current) =>
        current
          ? {
              ...current,
              name: nextName,
              email: nextEmail,
              avatarUrl: normalizedAvatarUrl,
            }
          : current,
      );
      setEmail(nextEmail);
      flashMessage("success", "Profile updated in demo mode.");
      return true;
    }

    if (!supabase) {
      flashMessage("error", "Supabase is required before profile changes can be saved.");
      return false;
    }

    const emailChanged = nextEmail !== session.email;
    const nameChanged = nextName !== session.name;
    const avatarChanged = normalizedAvatarUrl !== session.avatarUrl;

    if (!emailChanged && !nameChanged && !avatarChanged) {
      flashMessage("neutral", "No profile changes to save.");
      return true;
    }

    setIsSavingProfile(true);

    try {
      const payload: {
        email?: string;
        data?: {
          name: string;
          avatar_url: string | null;
        };
      } = {};

      if (emailChanged) {
        payload.email = nextEmail;
      }

      if (nameChanged || avatarChanged) {
        payload.data = {
          name: nextName,
          avatar_url: normalizedAvatarUrl,
        };
      }

      const { data, error } = await supabase.auth.updateUser(payload);
      if (error) {
        throw error;
      }

      const updatedName = readMetadataName(data.user?.user_metadata, nextName);
      const updatedAvatarUrl = readMetadataAvatarUrl(data.user?.user_metadata, normalizedAvatarUrl);
      const updatedEmail = data.user?.email?.trim().toLowerCase() || nextEmail;

      setSession((current) =>
        current
          ? {
              ...current,
              name: updatedName,
              email: updatedEmail,
              avatarUrl: updatedAvatarUrl,
            }
          : current,
      );
      setEmail(updatedEmail);
      flashMessage(
        "success",
        emailChanged
          ? "Profile updated. Check your email if Supabase asks you to confirm the address change."
          : "Profile updated.",
      );
      return true;
    } catch (error) {
      flashMessage("error", error instanceof Error ? error.message : "Unable to save your profile.");
      return false;
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function updatePassword(nextPassword: string) {
    const trimmedPassword = nextPassword.trim();

    if (session?.mode !== "cloud" || !supabase) {
      flashMessage("warning", "Password changes are only available for real cloud accounts.");
      return false;
    }

    if (trimmedPassword.length < 8) {
      flashMessage("warning", "Use at least 8 characters for the new password.");
      return false;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: trimmedPassword });
      if (error) {
        throw error;
      }

      flashMessage("success", "Password updated.");
      return true;
    } catch (error) {
      flashMessage("error", error instanceof Error ? error.message : "Unable to update the password.");
      return false;
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  function openSupportComposer(type: "support" | "bug" | "feature") {
    if (typeof window === "undefined") {
      return;
    }

    const subject =
      type === "support"
        ? "SmartBudget Support"
        : type === "bug"
          ? "SmartBudget Bug Report"
          : "SmartBudget Feature Suggestion";
    const body =
      type === "support"
        ? `Hi SmartBudget support,\n\nName: ${session?.name ?? ""}\nEmail: ${session?.email ?? ""}\n\nHow can you help?`
        : `Hi SmartBudget team,\n\nName: ${session?.name ?? ""}\nEmail: ${session?.email ?? ""}\n\n${
            type === "bug" ? "What happened?" : "What feature would you like to see?"
          }`;

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  async function shareApp() {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: "SmartBudget",
          text: APP_SHARE_MESSAGE,
        });
        return true;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(APP_SHARE_MESSAGE);
        flashMessage("neutral", "Share text copied. Paste it into WhatsApp, Messages, Telegram, or another app.");
        return true;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return false;
      }

      flashMessage("error", error instanceof Error ? error.message : "Unable to open the share sheet.");
      return false;
    }

    flashMessage("warning", "Sharing is not supported on this device.");
    return false;
  }

  async function deleteAccount() {
    if (!session) {
      return false;
    }

    if (session.mode !== "cloud" || !supabase) {
      flashMessage("warning", "Account deletion is only available for real cloud accounts.");
      return false;
    }

    setIsDeletingAccount(true);

    try {
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
      const accessToken = authSession?.access_token?.trim();

      if (!accessToken) {
        throw new Error("Your session expired. Sign in again before deleting the account.");
      }

      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(typeof payload?.error === "string" ? payload.error : "Unable to delete your account.");
      }

      await supabase.auth.signOut();
      clearSessionState();
      flashMessage("neutral", "Your SmartBudget account has been deleted.");
      return true;
    } catch (error) {
      flashMessage("error", error instanceof Error ? error.message : "Unable to delete your account.");
      return false;
    } finally {
      setIsDeletingAccount(false);
    }
  }

  async function classifySmsTransaction(rawSms: string): Promise<SmsClassification | null> {
    const trimmedSms = rawSms.trim();
    if (!trimmedSms) {
      return null;
    }

    const parsed = parseSmsTransaction(trimmedSms);
    let fallback: SmsClassification | null = parsed
      ? {
          isTransaction: true,
          merchant: parsed.merchant,
          amount: parsed.amount,
          category: parsed.category,
          kind: parsed.kind,
          currency: parsed.currency,
        }
      : null;

    try {
      const response = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ smsText: trimmedSms }),
      });

      if (response.ok) {
        const aiResult = await response.json();

        if (aiResult?.isTransaction === false) {
          return null;
        }

        const amount = Number(aiResult?.amount);
        const merchant = typeof aiResult?.merchant === "string" ? aiResult.merchant.trim() : "";
        const category = typeof aiResult?.category === "string" ? normalizeCategory(aiResult.category) : fallback?.category ?? "Other";
        const kind = aiResult?.kind === "income" || aiResult?.kind === "expense" ? aiResult.kind : fallback?.kind ?? "expense";
        const currency =
          aiResult?.currency === "USD" || aiResult?.currency === "EUR" || aiResult?.currency === "TRY"
            ? aiResult.currency
            : fallback?.currency ?? "TRY";

        if (Number.isFinite(amount) && amount > 0) {
          fallback = {
            isTransaction: true,
            merchant: merchant && merchant !== "Unknown" ? merchant : fallback?.merchant ?? "Unknown Merchant",
            amount,
            category,
            kind,
            currency,
          };
        }
      }
    } catch {
      // Local parsing remains the fallback when the AI endpoint is unavailable.
    }

    if (!fallback || !Number.isFinite(fallback.amount) || fallback.amount <= 0) {
      return null;
    }

    return fallback;
  }

  async function convertIncomingSmsToTransaction(message: AndroidSmsInboxMessage): Promise<Transaction | null> {
    const rawSms = message.body.trim();
    if (!rawSms) {
      return null;
    }

    const classification = await classifySmsTransaction(rawSms);
    if (!classification?.isTransaction) {
      return null;
    }

    const date = Number.isFinite(message.date) ? new Date(message.date).toISOString() : new Date().toISOString();

    return {
      id: `sms-${message.id || crypto.randomUUID()}`,
      date,
      merchant: classification.merchant || "Unknown Merchant",
      amount: classification.amount,
      currency: classification.currency,
      category: classification.category,
      kind: classification.kind,
      source: "sms",
      rawSms,
    };
  }

  async function ingestAndroidSmsMessages(
    messages: AndroidSmsInboxMessage[],
    options: {
      notifyOnImport?: boolean;
      notifyWhenIgnored?: boolean;
      notifyIfDuplicate?: boolean;
    } = {},
  ) {
    const { notifyOnImport = true, notifyWhenIgnored = true, notifyIfDuplicate = true } = options;
    if (messages.length === 0) {
      if (notifyWhenIgnored) {
        flashMessage("warning", "No SMS messages were available to process.");
      }

      return {
        addedCount: 0,
        ignoredCount: 0,
        duplicateCount: 0,
      };
    }

    const existingRawSms = new Set(
      cloudState.transactions
        .map((transaction) => transaction.rawSms?.trim())
        .filter((value): value is string => Boolean(value)),
    );
    const seenIncoming = new Set<string>();
    const candidates: AndroidSmsInboxMessage[] = [];
    let duplicateCount = 0;

    for (const message of messages) {
      const rawSms = message.body.trim();
      if (!rawSms) {
        continue;
      }

      if (existingRawSms.has(rawSms) || seenIncoming.has(rawSms)) {
        duplicateCount += 1;
        continue;
      }

      seenIncoming.add(rawSms);
      candidates.push(message);
    }

    const resolved = await Promise.all(candidates.map((message) => convertIncomingSmsToTransaction(message)));
    const transactions = resolved.filter((transaction): transaction is Transaction => transaction !== null);
    let addedCount = 0;

    if (transactions.length > 0) {
      setCloudState((current) => {
        const merged = mergeTransactions(current.transactions, transactions);
        addedCount = merged.addedCount;
        if (merged.addedCount === 0) {
          return current;
        }

        return {
          ...current,
          transactions: merged.transactions,
        };
      });
    }

    duplicateCount += Math.max(0, transactions.length - addedCount);
    const ignoredCount = Math.max(0, candidates.length - transactions.length);

    if (addedCount > 0) {
      setAiAdvice(null);
      if (notifyOnImport) {
        flashMessage("success", `Added ${addedCount} transaction${addedCount === 1 ? "" : "s"} from bank SMS.`);
      }
    } else if (duplicateCount > 0 && notifyIfDuplicate) {
      flashMessage("neutral", "These bank messages were already synced.");
    } else if (ignoredCount > 0 && notifyWhenIgnored) {
      flashMessage("warning", "SmartBudget scanned those messages, but none of them looked like bank transactions.");
    }

    return {
      addedCount,
      ignoredCount,
      duplicateCount,
    };
  }

  function addManualTransaction(entry: ManualTransactionDraft) {
    const merchant = entry.merchant.trim();
    const amount = Number(entry.amount);
    if (!merchant || !Number.isFinite(amount) || amount <= 0) {
      flashMessage("warning", "Enter a merchant and a valid amount before saving a manual transaction.");
      return false;
    }

    const normalizedDate = Number.isNaN(new Date(entry.date).getTime()) ? new Date().toISOString() : new Date(entry.date).toISOString();
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      date: normalizedDate,
      merchant,
      amount,
      currency: entry.currency,
      category: entry.category,
      kind: entry.kind,
      source: "manual",
    };

    setCloudState((current) => ({
      ...current,
      transactions: [transaction, ...current.transactions],
    }));
    setAiAdvice(null);
    setDeviceState((current) => ({ ...current, activeScreen: "transactions" }));
    flashMessage(
      "success",
      `${transaction.kind === "income" ? "Credit" : "Debit"} added: ${transaction.merchant} - ${formatMoney(transaction.amount, transaction.currency)}.`,
    );
    return true;
  }

  function deleteTransaction(id: string) {
    setCloudState((current) => ({
      ...current,
      transactions: current.transactions.filter((transaction) => transaction.id !== id),
    }));
    setAiAdvice(null);
    flashMessage("neutral", "Transaction removed from the ledger.");
  }

  function updateTransaction(id: string, updates: Partial<Pick<Transaction, "merchant" | "category">>) {
    let changed = false;
    let invalidMerchant = false;

    setCloudState((current) => {
      const nextTransactions = current.transactions.map((transaction) => {
        if (transaction.id !== id) {
          return transaction;
        }

        const nextMerchant =
          updates.merchant === undefined
            ? transaction.merchant
            : updates.merchant.trim();

        if (!nextMerchant) {
          invalidMerchant = true;
          return transaction;
        }

        const nextCategory = updates.category ?? transaction.category;

        if (nextMerchant === transaction.merchant && nextCategory === transaction.category) {
          return transaction;
        }

        changed = true;
        return {
          ...transaction,
          merchant: nextMerchant,
          category: nextCategory,
        };
      });

      if (!changed) {
        return current;
      }

      return {
        ...current,
        transactions: nextTransactions,
      };
    });

    if (invalidMerchant) {
      flashMessage("warning", "Merchant name cannot be empty.");
      return false;
    }

    if (changed) {
      setAiAdvice(null);
    }

    return true;
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
    const authRedirectUrl = getAuthRedirectUrl();

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
          authRedirectUrl={authRedirectUrl}
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
          onAllowSmsAccess={handleAllowSmsAccess}
          onUseDemoData={loadDemoData}
          allowDemoData={session.mode === "demo"}
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
        goalProgress={goalProgress}
        safeSavings={safeSavings}
        protectedSavings={protectedSavings}
        convertedSavings={convertedSavings}
        projection={projection}
        targetCurrency={cloudState.targetCurrency}
        smartSaveGoal={cloudState.smartSaveGoal}
        isImportingNativeSms={isImportingNativeSms}
        isRefreshingAdvice={isRefreshingAdvice}
        isSavingProfile={isSavingProfile}
        isUpdatingPassword={isUpdatingPassword}
        isDeletingAccount={isDeletingAccount}
        adviceCards={adviceCards}
        insights={insights}
        onSelectScreen={updateScreen}
        onSignOut={handleSignOut}
        onRefreshAdvice={refreshAdvice}
        onImportNativeSms={handleAllowSmsAccess}
        onAddManualTransaction={addManualTransaction}
        onUpdateTransaction={updateTransaction}
        onDeleteTransaction={deleteTransaction}
        onUpdateGoal={updateGoal}
        onUpdateTargetCurrency={updateTargetCurrency}
        onSaveProfileDetails={saveProfileDetails}
        onUpdatePassword={updatePassword}
        onOpenSupportComposer={openSupportComposer}
        onShareApp={shareApp}
        onDeleteAccount={deleteAccount}
      />
      <Toast flash={flash} />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="auth-layout loading-layout">
      <Panel title="SmartBudget" subtitle="Syncing your cloud account" className="hero-panel auth-hero">
        <div className="hero-badge">
          <img className="hero-badge__logo" src="/smartbudgetlogo.png" alt="SmartBudget logo" />
          SmartBudget
        </div>
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
    avatarUrl: null,
    mode: "demo",
  };
}

function buildSessionFromSupabase(session: SupabaseSession): Session {
  const email = session.user.email?.trim().toLowerCase() || "student@smartbudget.app";
  const metadataName = readMetadataName(session.user.user_metadata);

  return {
    userId: session.user.id,
    email,
    name: metadataName || displayNameFromEmail(email),
    avatarUrl: readMetadataAvatarUrl(session.user.user_metadata),
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

function readMetadataName(metadata: unknown, fallback = "") {
  return typeof (metadata as { name?: unknown } | null)?.name === "string"
    ? (metadata as { name: string }).name.trim() || fallback
    : fallback;
}

function readMetadataAvatarUrl(metadata: unknown, fallback: string | null = null) {
  return typeof (metadata as { avatar_url?: unknown } | null)?.avatar_url === "string"
    ? (metadata as { avatar_url: string }).avatar_url.trim() || fallback
    : fallback;
}

function getAuthRedirectUrl() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return `${window.location.origin}/`;
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
