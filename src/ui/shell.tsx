import type { ComponentType } from "react";
import { Home, Lightbulb, PiggyBank, ReceiptText, TrendingUp } from "lucide-react";
import type { AdviceCard, CurrencyCode, FinancialSummary, ManualTransactionDraft, ScreenKey, Transaction } from "../types";
import { buildCategoryBreakdown, buildMonthlyTrend, buildWeeklyTrend, convertCurrency, projectSavings } from "../lib/finance";
import { AdviceScreen, AnalysisScreen, DashboardScreen, ProfileScreen, SmartSaveScreen, TransactionsScreen } from "./screens";

type AppSessionView = {
  email: string;
  name: string;
  avatarUrl: string | null;
  mode: "cloud" | "demo";
};

export function AppShell({
  session,
  activeScreen,
  summary,
  transactions,
  isAndroidNative,
  goalProgress,
  safeSavings,
  protectedSavings,
  convertedSavings,
  projection,
  targetCurrency,
  smartSaveGoal,
  isImportingNativeSms,
  isRefreshingAdvice,
  isSavingProfile,
  isUpdatingPassword,
  isDeletingAccount,
  adviceCards,
  insights,
  onSelectScreen,
  onSignOut,
  onRefreshAdvice,
  onImportNativeSms,
  onAddManualTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onUpdateGoal,
  onUpdateTargetCurrency,
  onSaveProfileDetails,
  onUpdatePassword,
  onOpenSupportComposer,
  onShareApp,
  onDeleteAccount,
}: {
  session: AppSessionView;
  activeScreen: ScreenKey;
  summary: FinancialSummary;
  transactions: Transaction[];
  isAndroidNative: boolean;
  goalProgress: number;
  safeSavings: number;
  protectedSavings: number;
  convertedSavings: number;
  projection: ReturnType<typeof projectSavings>;
  targetCurrency: CurrencyCode;
  smartSaveGoal: number;
  isImportingNativeSms: boolean;
  isRefreshingAdvice: boolean;
  isSavingProfile: boolean;
  isUpdatingPassword: boolean;
  isDeletingAccount: boolean;
  adviceCards: AdviceCard[];
  insights: string[];
  onSelectScreen: (screen: ScreenKey) => void;
  onSignOut: () => Promise<void>;
  onRefreshAdvice: () => void;
  onImportNativeSms: () => void;
  onAddManualTransaction: (entry: ManualTransactionDraft) => boolean;
  onUpdateTransaction: (id: string, updates: Partial<Pick<Transaction, "merchant" | "category">>) => boolean;
  onDeleteTransaction: (id: string) => void;
  onUpdateGoal: (value: number) => void;
  onUpdateTargetCurrency: (value: CurrencyCode) => void;
  onSaveProfileDetails: (input: { name: string; email: string; avatarUrl: string }) => Promise<boolean>;
  onUpdatePassword: (nextPassword: string) => Promise<boolean>;
  onOpenSupportComposer: (type: "support" | "bug" | "feature") => void;
  onShareApp: () => Promise<boolean>;
  onDeleteAccount: () => Promise<boolean>;
}) {
  const categoryBreakdown = buildCategoryBreakdown(transactions);
  const monthlyTrend = buildMonthlyTrend(transactions, 6);
  const yearlyTrend = buildMonthlyTrend(transactions, 12);
  const weeklyTrend = buildWeeklyTrend(transactions, 8);
  const headerMeta = getHeaderMeta(activeScreen);
  const screen = renderScreen({
    session,
    activeScreen,
    summary,
    categoryBreakdown,
    monthlyTrend,
    yearlyTrend,
    weeklyTrend,
    transactions,
    isAndroidNative,
    goalProgress,
    safeSavings,
    protectedSavings,
    convertedSavings,
    projection,
    targetCurrency,
    smartSaveGoal,
    isImportingNativeSms,
    isRefreshingAdvice,
    isSavingProfile,
    isUpdatingPassword,
    isDeletingAccount,
    adviceCards,
    insights,
    onSelectScreen,
    onDeleteTransaction,
    onAddManualTransaction,
    onUpdateTransaction,
    onUpdateGoal,
    onUpdateTargetCurrency,
    onImportNativeSms,
    onRefreshAdvice,
    onSaveProfileDetails,
    onUpdatePassword,
    onOpenSupportComposer,
    onShareApp,
    onSignOut,
    onDeleteAccount,
  });

  const initials = session.name.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="phone-shell">
      <header className="phone-header">
        <div className="phone-brand phone-brand--screen">
          <div className="phone-brand__mark phone-brand__mark--ghost">
            <img className="phone-brand__logo" src="/smartbudgetlogo.png" alt="SmartBudget logo" />
          </div>
          <div className="phone-brand__text">
            <strong>{headerMeta.title}</strong>
            <span>{headerMeta.subtitle}</span>
          </div>
        </div>

        <div className="phone-header__actions">
          <span className="phone-header__user-name" title={session.name}>
            {session.name}
          </span>
          <button className="avatar-button" type="button" onClick={() => onSelectScreen("profile")} aria-label="Open profile">
            <span className="avatar-button__initials">{initials}</span>
            {session.avatarUrl ? (
              <img
                key={session.avatarUrl}
                className="avatar-button__image"
                src={session.avatarUrl}
                alt={`${session.name} profile`}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : null}
          </button>
        </div>
      </header>

      <main className="phone-main">
        <div className="phone-main__inner">{screen}</div>
      </main>

      <nav className="phone-nav" aria-label="Primary navigation">
        <NavItem label="Home" icon={Home} active={activeScreen === "dashboard"} onClick={() => onSelectScreen("dashboard")} />
        <NavItem label="Add Transaction" icon={ReceiptText} active={activeScreen === "transactions"} onClick={() => onSelectScreen("transactions")} />
        <NavItem label="Statistics" icon={TrendingUp} active={activeScreen === "analysis"} onClick={() => onSelectScreen("analysis")} />
        <NavItem label="Budget Safe" icon={PiggyBank} active={activeScreen === "save"} onClick={() => onSelectScreen("save")} />
        <NavItem label="AI Coach" icon={Lightbulb} active={activeScreen === "advice"} onClick={() => onSelectScreen("advice")} />
      </nav>
    </div>
  );
}

function NavItem({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`phone-nav__item ${active ? "phone-nav__item--active" : ""}`} onClick={onClick} aria-label={label}>
      <Icon size={24} className="phone-nav__icon" />
    </button>
  );
}

function renderScreen({
  session,
  activeScreen,
  summary,
  categoryBreakdown,
  monthlyTrend,
  yearlyTrend,
  weeklyTrend,
  transactions,
  isAndroidNative,
  goalProgress,
  safeSavings,
  protectedSavings,
  convertedSavings,
  projection,
  targetCurrency,
  smartSaveGoal,
  isImportingNativeSms,
  isRefreshingAdvice,
  isSavingProfile,
  isUpdatingPassword,
  isDeletingAccount,
  adviceCards,
  insights,
  onSelectScreen,
  onDeleteTransaction,
  onAddManualTransaction,
  onUpdateTransaction,
  onUpdateGoal,
  onUpdateTargetCurrency,
  onImportNativeSms,
  onRefreshAdvice,
  onSaveProfileDetails,
  onUpdatePassword,
  onOpenSupportComposer,
  onShareApp,
  onSignOut,
  onDeleteAccount,
}: {
  session: AppSessionView;
  activeScreen: ScreenKey;
  summary: FinancialSummary;
  categoryBreakdown: ReturnType<typeof buildCategoryBreakdown>;
  monthlyTrend: ReturnType<typeof buildMonthlyTrend>;
  yearlyTrend: ReturnType<typeof buildMonthlyTrend>;
  weeklyTrend: ReturnType<typeof buildWeeklyTrend>;
  transactions: Transaction[];
  isAndroidNative: boolean;
  goalProgress: number;
  safeSavings: number;
  protectedSavings: number;
  convertedSavings: number;
  projection: ReturnType<typeof projectSavings>;
  targetCurrency: CurrencyCode;
  smartSaveGoal: number;
  isImportingNativeSms: boolean;
  isRefreshingAdvice: boolean;
  isSavingProfile: boolean;
  isUpdatingPassword: boolean;
  isDeletingAccount: boolean;
  adviceCards: AdviceCard[];
  insights: string[];
  onSelectScreen: (screen: ScreenKey) => void;
  onDeleteTransaction: (id: string) => void;
  onAddManualTransaction: (entry: ManualTransactionDraft) => boolean;
  onUpdateTransaction: (id: string, updates: Partial<Pick<Transaction, "merchant" | "category">>) => boolean;
  onUpdateGoal: (value: number) => void;
  onUpdateTargetCurrency: (value: CurrencyCode) => void;
  onImportNativeSms: () => void;
  onRefreshAdvice: () => void;
  onSaveProfileDetails: (input: { name: string; email: string; avatarUrl: string }) => Promise<boolean>;
  onUpdatePassword: (nextPassword: string) => Promise<boolean>;
  onOpenSupportComposer: (type: "support" | "bug" | "feature") => void;
  onShareApp: () => Promise<boolean>;
  onSignOut: () => Promise<void>;
  onDeleteAccount: () => Promise<boolean>;
}) {
  switch (activeScreen) {
    case "dashboard":
      return (
        <DashboardScreen
          summary={summary}
          categoryBreakdown={categoryBreakdown}
          monthlyTrend={monthlyTrend}
          recentTransactions={transactions.slice(0, 6)}
          insights={insights}
          isAndroidNative={isAndroidNative}
          goalProgress={goalProgress}
          safeSavings={safeSavings}
          isImportingNativeSms={isImportingNativeSms}
          onImportNativeSms={onImportNativeSms}
          onSetScreen={onSelectScreen}
        />
      );
    case "transactions":
      return (
        <TransactionsScreen
          transactions={transactions}
          isAndroidNative={isAndroidNative}
          isImportingNativeSms={isImportingNativeSms}
          onAddManualTransaction={onAddManualTransaction}
          onUpdateTransaction={onUpdateTransaction}
          onDeleteTransaction={onDeleteTransaction}
          onImportNativeSms={onImportNativeSms}
          onSetScreen={onSelectScreen}
        />
      );
    case "analysis":
      return (
        <AnalysisScreen
          summary={summary}
          categoryBreakdown={categoryBreakdown}
          monthlyTrend={monthlyTrend}
          yearlyTrend={yearlyTrend}
          weeklyTrend={weeklyTrend}
          insights={insights}
        />
      );
    case "save":
      return (
        <SmartSaveScreen
          summary={summary}
          goalProgress={goalProgress}
          safeSavings={safeSavings}
          protectedSavings={protectedSavings}
          convertedSavings={convertedSavings}
          projection={projection}
          targetCurrency={targetCurrency}
          smartSaveGoal={smartSaveGoal}
          onUpdateGoal={onUpdateGoal}
          onUpdateTargetCurrency={onUpdateTargetCurrency}
        />
      );
    case "advice":
      return (
        <AdviceScreen
          summary={summary}
          adviceCards={adviceCards}
          insights={insights}
          defaultWhatIfAmountUsd={protectedSavings > 0 ? convertCurrency(protectedSavings, "USD") : 100}
          isBackedBySavings={protectedSavings > 0}
          isRefreshingAdvice={isRefreshingAdvice}
          onRefreshAdvice={onRefreshAdvice}
        />
      );
    case "profile":
      return (
        <ProfileScreen
          session={session}
          isSavingProfile={isSavingProfile}
          isUpdatingPassword={isUpdatingPassword}
          isDeletingAccount={isDeletingAccount}
          onSaveProfileDetails={onSaveProfileDetails}
          onUpdatePassword={onUpdatePassword}
          onOpenSupportComposer={onOpenSupportComposer}
          onShareApp={onShareApp}
          onSignOut={onSignOut}
          onDeleteAccount={onDeleteAccount}
        />
      );
    default:
      return null;
  }
}

function getHeaderMeta(activeScreen: ScreenKey) {
  const currentMonth = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  switch (activeScreen) {
    case "dashboard":
      return {
        title: "Dashboard",
        subtitle: currentMonth,
      };
    case "transactions":
      return {
        title: "Add Transaction",
        subtitle: "Auto SMS sync and manual debit / credit entry",
      };
    case "analysis":
      return {
        title: "Statistics",
        subtitle: "Live spending trends and category pressure",
      };
    case "save":
      return {
        title: "Budget Safe",
        subtitle: "Protect savings with Smart Save+",
      };
    case "advice":
      return {
        title: "AI Coach",
        subtitle: "Actionable recommendations for your next move",
      };
    case "profile":
      return {
        title: "Profile",
        subtitle: "Account settings, support, and sharing",
      };
    default:
      return {
        title: "SmartBudget",
        subtitle: currentMonth,
      };
  }
}
