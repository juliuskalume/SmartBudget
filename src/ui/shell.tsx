import type { ComponentType, ReactNode } from "react";
import {
  Bell,
  Home,
  Lightbulb,
  PiggyBank,
  ReceiptText,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { AdviceCard, CurrencyCode, FinancialSummary, ScreenKey, Transaction } from "../types";
import { buildCategoryBreakdown, buildMonthlyTrend, buildWeeklyTrend, projectSavings } from "../lib/finance";
import { AdviceScreen, AnalysisScreen, DashboardScreen, SmartSaveScreen, TransactionsScreen } from "./screens";

export function AppShell({
  session,
  activeScreen,
  summary,
  transactions,
  allowDemoTools,
  isAndroidNative,
  smsDraft,
  setSmsDraft,
  goalProgress,
  safeSavings,
  protectedSavings,
  convertedSavings,
  projection,
  targetCurrency,
  smartSaveGoal,
  isAnalyzingSms,
  isImportingNativeSms,
  isRefreshingAdvice,
  adviceCards,
  insights,
  onSelectScreen,
  onSignOut,
  onRefreshAdvice,
  onAnalyzeSms,
  onImportNativeSms,
  onUseDemoData,
  onDeleteTransaction,
  onUpdateGoal,
  onUpdateTargetCurrency,
  onFillSampleSms,
  }: {
  session: { email: string; name: string };
  activeScreen: ScreenKey;
  summary: FinancialSummary;
  transactions: Transaction[];
  allowDemoTools: boolean;
  isAndroidNative: boolean;
  smsDraft: string;
  setSmsDraft: (value: string) => void;
  goalProgress: number;
  safeSavings: number;
  protectedSavings: number;
  convertedSavings: number;
  projection: ReturnType<typeof projectSavings>;
  targetCurrency: CurrencyCode;
  smartSaveGoal: number;
  isAnalyzingSms: boolean;
  isImportingNativeSms: boolean;
  isRefreshingAdvice: boolean;
  adviceCards: AdviceCard[];
  insights: string[];
  onSelectScreen: (screen: ScreenKey) => void;
  onSignOut: () => void;
  onRefreshAdvice: () => void;
  onAnalyzeSms: () => void;
  onImportNativeSms: () => void;
  onUseDemoData: () => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateGoal: (value: number) => void;
  onUpdateTargetCurrency: (value: CurrencyCode) => void;
  onFillSampleSms: (value: string) => void;
}) {
  const categoryBreakdown = buildCategoryBreakdown(transactions);
  const monthlyTrend = buildMonthlyTrend(transactions, 6);
  const yearlyTrend = buildMonthlyTrend(transactions, 12);
  const weeklyTrend = buildWeeklyTrend(transactions, 8);
  const headerMeta = getHeaderMeta(activeScreen);
  const screen = renderScreen({
    activeScreen,
    summary,
    categoryBreakdown,
    monthlyTrend,
    yearlyTrend,
    weeklyTrend,
    transactions,
    allowDemoTools,
    isAndroidNative,
    smsDraft,
    setSmsDraft,
    goalProgress,
    safeSavings,
    protectedSavings,
    convertedSavings,
    projection,
    targetCurrency,
    smartSaveGoal,
    isAnalyzingSms,
    isImportingNativeSms,
    isRefreshingAdvice,
    adviceCards,
    insights,
    onSelectScreen,
    onDeleteTransaction,
    onUpdateGoal,
    onUpdateTargetCurrency,
    onFillSampleSms,
    onAnalyzeSms,
    onImportNativeSms,
    onRefreshAdvice,
  });

  const initials = session.name.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="phone-shell">
      <header className="phone-header">
        <div className="phone-brand phone-brand--screen">
          <div className="phone-brand__mark phone-brand__mark--ghost">
            <Wallet size={18} />
          </div>
          <div className="phone-brand__text">
            <strong>{headerMeta.title}</strong>
            <span>{headerMeta.subtitle}</span>
          </div>
        </div>

        <div className="phone-header__actions">
          <button
            className="icon-button icon-button--soft"
            type="button"
            onClick={() => onSelectScreen("advice")}
            aria-label="Open notifications"
          >
            <Bell size={18} />
          </button>
          <button className="avatar-button" type="button" onClick={onSignOut} aria-label="User profile and sign out">
            {initials}
          </button>
        </div>
      </header>

      <main className="phone-main">
        <div className="phone-main__inner">{screen}</div>
      </main>

      <nav className="phone-nav" aria-label="Primary navigation">
        <NavItem label="Home" icon={Home} active={activeScreen === "dashboard"} onClick={() => onSelectScreen("dashboard")} />
        <NavItem label="Add" icon={ReceiptText} active={activeScreen === "transactions"} onClick={() => onSelectScreen("transactions")} />
        <NavItem label="Stats" icon={TrendingUp} active={activeScreen === "analysis"} onClick={() => onSelectScreen("analysis")} />
        <NavItem label="Save" icon={PiggyBank} active={activeScreen === "save"} onClick={() => onSelectScreen("save")} />
        <NavItem label="AI" icon={Lightbulb} active={activeScreen === "advice"} onClick={() => onSelectScreen("advice")} />
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
    <button
      type="button"
      className={`phone-nav__item ${active ? "phone-nav__item--active" : ""}`}
      onClick={onClick}
    >
      <Icon size={20} className="phone-nav__icon" />
      <span>{label}</span>
    </button>
  );
}

function renderScreen({
  activeScreen,
  summary,
  categoryBreakdown,
  monthlyTrend,
  yearlyTrend,
  weeklyTrend,
  transactions,
  allowDemoTools,
  isAndroidNative,
  smsDraft,
  setSmsDraft,
  goalProgress,
  safeSavings,
  protectedSavings,
  convertedSavings,
  projection,
  targetCurrency,
  smartSaveGoal,
  isAnalyzingSms,
  isImportingNativeSms,
  isRefreshingAdvice,
  adviceCards,
  insights,
  onSelectScreen,
  onDeleteTransaction,
  onUpdateGoal,
  onUpdateTargetCurrency,
  onFillSampleSms,
  onAnalyzeSms,
  onImportNativeSms,
  onRefreshAdvice,
}: {
  activeScreen: ScreenKey;
  summary: FinancialSummary;
  categoryBreakdown: ReturnType<typeof buildCategoryBreakdown>;
  monthlyTrend: ReturnType<typeof buildMonthlyTrend>;
  yearlyTrend: ReturnType<typeof buildMonthlyTrend>;
  weeklyTrend: ReturnType<typeof buildWeeklyTrend>;
  transactions: Transaction[];
  allowDemoTools: boolean;
  isAndroidNative: boolean;
  smsDraft: string;
  setSmsDraft: (value: string) => void;
  goalProgress: number;
  safeSavings: number;
  protectedSavings: number;
  convertedSavings: number;
  projection: ReturnType<typeof projectSavings>;
  targetCurrency: CurrencyCode;
  smartSaveGoal: number;
  isAnalyzingSms: boolean;
  isImportingNativeSms: boolean;
  isRefreshingAdvice: boolean;
  adviceCards: AdviceCard[];
  insights: string[];
  onSelectScreen: (screen: ScreenKey) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateGoal: (value: number) => void;
  onUpdateTargetCurrency: (value: CurrencyCode) => void;
  onFillSampleSms: (value: string) => void;
  onAnalyzeSms: () => void;
  onImportNativeSms: () => void;
  onRefreshAdvice: () => void;
}) {
  switch (activeScreen) {
    case "dashboard":
      return (
        <DashboardScreen
          summary={summary}
          categoryBreakdown={categoryBreakdown}
          monthlyTrend={monthlyTrend}
          recentTransactions={transactions.slice(0, 6)}
          allowDemoTools={allowDemoTools}
          insights={insights}
          isAndroidNative={isAndroidNative}
          smsDraft={smsDraft}
          setSmsDraft={setSmsDraft}
          goalProgress={goalProgress}
          safeSavings={safeSavings}
          isAnalyzingSms={isAnalyzingSms}
          isImportingNativeSms={isImportingNativeSms}
          onAnalyzeSms={onAnalyzeSms}
          onFillSampleSms={onFillSampleSms}
          onImportNativeSms={onImportNativeSms}
          onSetScreen={onSelectScreen}
        />
      );
    case "transactions":
      return (
        <TransactionsScreen
          transactions={transactions}
          allowDemoTools={allowDemoTools}
          smsDraft={smsDraft}
          setSmsDraft={setSmsDraft}
          isAnalyzingSms={isAnalyzingSms}
          isAndroidNative={isAndroidNative}
          isImportingNativeSms={isImportingNativeSms}
          onDeleteTransaction={onDeleteTransaction}
          onFillSampleSms={onFillSampleSms}
          onAnalyzeSms={onAnalyzeSms}
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
          isRefreshingAdvice={isRefreshingAdvice}
          onRefreshAdvice={onRefreshAdvice}
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
        subtitle: "Import from SMS and review the ledger",
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
    default:
      return {
        title: "SmartBudget",
        subtitle: currentMonth,
      };
  }
}
