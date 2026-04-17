import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRightLeft,
  ArrowUpRight,
  BadgeDollarSign,
  BarChart3,
  BrainCircuit,
  BusFront,
  Clapperboard,
  CheckCircle2,
  CircleDollarSign,
  Filter,
  GraduationCap,
  HeartPulse,
  House,
  Menu,
  PiggyBank,
  PieChart as PieChartIcon,
  Receipt,
  ReceiptText,
  ScanText,
  Search,
  ShoppingBag,
  Target,
  Trash2,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { Bar, BarChart, Cell, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { targetCurrencies } from "../lib/demo";
import {
  buildCategoryBreakdown,
  buildMonthlyTrend,
  convertCurrency,
  formatDateLabel,
  formatMoney,
  formatPercent,
  projectSavings,
  CATEGORY_COLORS,
} from "../lib/finance";
import type { AdviceCard, Category, CurrencyCode, FinancialSummary, ManualTransactionDraft, ScreenKey, Transaction, WhatIfPeriod, WhatIfScenario } from "../types";
import { Badge, ChartFrame, EmptyState, HealthDial, MetricCard, Panel } from "./shared";

const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: "rgba(7,7,7,0.98)",
    border: "1px solid rgba(255,253,2,0.28)",
    borderRadius: 20,
    boxShadow: "0 22px 40px rgba(0,0,0,0.48)",
    color: "#fffef2",
  },
  labelStyle: {
    color: "#fff38a",
    fontWeight: 700,
  },
  itemStyle: {
    color: "#fffef2",
  },
  cursor: {
    fill: "rgba(255,253,2,0.08)",
  },
};

const chartAxisProps = {
  axisLine: false,
  tickLine: false,
  tick: { fill: "#d5cc8a", fontSize: 11 },
};

const categoryIconMap = {
  Supermarket: UtensilsCrossed,
  Transport: BusFront,
  Entertainment: Clapperboard,
  Bills: Receipt,
  Education: GraduationCap,
  Other: ShoppingBag,
} as const;

const transactionCategories: Category[] = ["Supermarket", "Transport", "Entertainment", "Bills", "Education", "Other"];

const transactionCategoryTiles = [
  { id: "food", label: "Food", category: "Supermarket" as const, icon: UtensilsCrossed },
  { id: "transport", label: "Transport", category: "Transport" as const, icon: BusFront },
  { id: "shopping", label: "Shopping", category: "Other" as const, icon: ShoppingBag },
  { id: "bills", label: "Bills", category: "Bills" as const, icon: Receipt },
  { id: "entertainment", label: "Entertainment", category: "Entertainment" as const, icon: Clapperboard },
  { id: "health", label: "Health", category: "Other" as const, icon: HeartPulse },
  { id: "home", label: "Home", category: "Bills" as const, icon: House },
  { id: "education", label: "Education", category: "Education" as const, icon: GraduationCap },
];

function createManualDraft(kind: Transaction["kind"] = "expense"): ManualTransactionDraft {
  return {
    merchant: "",
    amount: 0,
    currency: "TRY",
    category: kind === "income" ? "Other" : "Supermarket",
    kind,
    date: new Date().toISOString().slice(0, 10),
  };
}

function getManualTileIdForCategory(category: Category) {
  return transactionCategoryTiles.find((tile) => tile.category === category)?.id ?? transactionCategoryTiles[0].id;
}

export function DashboardScreen({
  summary,
  categoryBreakdown,
  monthlyTrend,
  recentTransactions,
  insights,
  isAndroidNative,
  goalProgress,
  safeSavings,
  isImportingNativeSms,
  onImportNativeSms,
  onSetScreen,
}: {
  summary: FinancialSummary;
  categoryBreakdown: ReturnType<typeof buildCategoryBreakdown>;
  monthlyTrend: ReturnType<typeof buildMonthlyTrend>;
  recentTransactions: Transaction[];
  insights: string[];
  isAndroidNative: boolean;
  goalProgress: number;
  safeSavings: number;
  isImportingNativeSms: boolean;
  onImportNativeSms: () => void;
  onSetScreen: (screen: ScreenKey) => void;
}) {
  const latestTransactions = recentTransactions.slice(0, 4);
  const hasTransactions = recentTransactions.length > 0;
  const totalBalance = summary.savings;
  const topCategories = categoryBreakdown.slice(0, 4);

  return (
    <div className="screen-stack screen-stack--dashboard">
      <section className="balance-card">
        <span className="balance-card__label">Total Balance</span>
        <strong className="balance-card__amount">{formatMoney(totalBalance)}</strong>
        <div className="balance-card__split">
          <div className="balance-card__item">
            <span>Income</span>
            <strong>{formatMoney(summary.totalIncome)}</strong>
          </div>
          <div className="balance-card__item">
            <span>Expenses</span>
            <strong>{formatMoney(summary.totalExpenses)}</strong>
          </div>
        </div>
      </section>

      <section className="metric-grid metric-grid--dashboard">
        <MetricCard icon={Wallet} label="Cash Flow" value={formatMoney(summary.cashFlow)} hint="Net movement this cycle" tone="sky" />
        <MetricCard
          icon={PiggyBank}
          label="Savings"
          value={formatPercent(summary.savingsRate)}
          hint={`${formatMoney(safeSavings)} ready to protect`}
          tone="mint"
        />
      </section>

      <Panel
        title="Spending By Category"
        subtitle={hasTransactions ? "Your current expense mix." : "Import transactions to populate this chart."}
      >
        {categoryBreakdown.length > 0 ? (
          <div className="category-overview">
            <ChartFrame height={220}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip {...chartTooltipStyle} formatter={(value) => formatMoney(Number(value))} />
                  <Pie
                    data={categoryBreakdown}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={84}
                    paddingAngle={3}
                  >
                    {categoryBreakdown.map((entry) => (
                      <Cell key={entry.category} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartFrame>

            <div className="category-legend">
              {topCategories.map((entry) => (
                <div className="category-legend__item" key={entry.category}>
                  <div className="category-legend__meta">
                    <span className="category-legend__dot" style={{ background: entry.color }} />
                    <span>{entry.category}</span>
                  </div>
                  <strong>{formatMoney(entry.amount)}</strong>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState title="No spending yet" description="Import a few transactions to unlock the category breakdown." />
        )}
      </Panel>

      <section className="dashboard-grid dashboard-grid--bottom">
        <Panel
          title="Automatic SMS Sync"
          subtitle={
            isAndroidNative
              ? "Incoming bank SMS are classified automatically on Android."
              : "Automatic bank-message detection runs in the Android app and syncs into this account."
          }
        >
          <div className="stack">
            <div className="sync-card">
              <div className="sync-card__icon">
                <ScanText size={18} />
              </div>
              <div className="sync-card__content">
                <strong>{isAndroidNative ? "Live bank-message monitoring is active" : "Automatic detection lives on Android"}</strong>
                <p>
                  {isAndroidNative
                    ? "New transaction alerts are checked as they arrive. Cash spending can be added manually from the transaction screen."
                    : "The web app does not ask users to paste SMS. Transactions detected in the Android app appear here once they sync to the same account."}
                </p>
              </div>
            </div>
            <div className="button-row button-row--tight">
              {isAndroidNative ? (
                <button className="button button--secondary" type="button" onClick={onImportNativeSms} disabled={isImportingNativeSms}>
                  <ScanText size={16} />
                  {isImportingNativeSms ? "Scanning..." : "Scan existing inbox"}
                </button>
              ) : null}
              <button className="button button--ghost" type="button" onClick={() => onSetScreen("transactions")}>
                <ReceiptText size={16} />
                Add Manual Entry
              </button>
            </div>
          </div>
        </Panel>

        <Panel
          title="Recent Transactions"
          subtitle={hasTransactions ? "Your latest ledger activity." : "Nothing has been added yet."}
          action={
            <button className="button button--ghost" type="button" onClick={() => onSetScreen("transactions")}>
              See all
            </button>
          }
        >
          {latestTransactions.length > 0 ? (
            <div className="transaction-snippets">
              {latestTransactions.map((transaction) => {
                const Icon = categoryIconMap[transaction.category] ?? ShoppingBag;

                return (
                  <div className="transaction-snippet" key={transaction.id}>
                    <div className="transaction-snippet__icon" style={{ color: CATEGORY_COLORS[transaction.category] }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <strong>{transaction.merchant}</strong>
                      <span>
                        {formatDateLabel(transaction.date)} - {transaction.category}
                      </span>
                    </div>
                    <strong className={transaction.kind === "income" ? "positive" : "negative"}>
                      {transaction.kind === "income" ? "+" : "-"}
                      {formatMoney(transaction.amount, transaction.currency)}
                    </strong>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No transactions yet" description="Your first synced or manual transaction will appear here." />
          )}
        </Panel>
      </section>

      <Panel title="Budget Signal" subtitle="What needs attention right now.">
        {hasTransactions ? (
          <div className="insight-list">
            {insights.slice(0, 2).map((insight) => (
              <div className="insight-row" key={insight}>
                <CheckCircle2 size={16} />
                <p>{insight}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="hero-strip__stack">
            <div className="summary-chip">
              <span>Health Score</span>
              <strong>{Math.round(summary.healthScore)} / 100</strong>
            </div>
            <div className="summary-chip summary-chip--accent">
              <span>Save Goal</span>
              <strong>{formatPercent(goalProgress)} ready</strong>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

export function TransactionsScreen({
  transactions,
  isAndroidNative,
  isImportingNativeSms,
  onAddManualTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onImportNativeSms,
  onSetScreen,
}: {
  transactions: Transaction[];
  isAndroidNative: boolean;
  isImportingNativeSms: boolean;
  onAddManualTransaction: (entry: ManualTransactionDraft) => boolean;
  onUpdateTransaction: (id: string, updates: Partial<Pick<Transaction, "merchant" | "category">>) => boolean;
  onDeleteTransaction: (id: string) => void;
  onImportNativeSms: () => void;
  onSetScreen: (screen: ScreenKey) => void;
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<Transaction["source"] | "all">("all");
  const [manualDraft, setManualDraft] = useState<ManualTransactionDraft>(() => createManualDraft());
  const [selectedManualTileId, setSelectedManualTileId] = useState(() => getManualTileIdForCategory(createManualDraft().category));
  const [editingMerchantId, setEditingMerchantId] = useState<string | null>(null);
  const [merchantDraft, setMerchantDraft] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const manualAmountDisplay = manualDraft.amount > 0 ? formatMoney(manualDraft.amount, manualDraft.currency) : formatMoney(0, manualDraft.currency);

  function startMerchantEdit(transaction: Transaction) {
    setEditingCategoryId(null);
    setEditingMerchantId(transaction.id);
    setMerchantDraft(transaction.merchant);
  }

  function stopMerchantEdit() {
    setEditingMerchantId(null);
    setMerchantDraft("");
  }

  function commitMerchantEdit(transactionId: string) {
    const nextMerchant = merchantDraft.trim();
    if (!onUpdateTransaction(transactionId, { merchant: nextMerchant })) {
      return;
    }

    stopMerchantEdit();
  }

  function commitCategoryEdit(transactionId: string, nextCategory: Category) {
    onUpdateTransaction(transactionId, { category: nextCategory });
    setEditingCategoryId(null);
  }

  const filtered = transactions.filter((transaction) => {
    const matchesQuery =
      query.trim().length === 0 ||
      `${transaction.merchant} ${transaction.category} ${transaction.rawSms ?? ""}`.toLowerCase().includes(query.toLowerCase().trim());
    const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;
    const matchesSource = sourceFilter === "all" || transaction.source === sourceFilter;
    return matchesQuery && matchesCategory && matchesSource;
  });

  return (
    <div className="screen-stack">
      <Panel
        title="Automatic SMS Sync"
        subtitle={
          isAndroidNative
            ? "SmartBudget listens for new bank SMS messages and classifies them in the background."
            : "Automatic bank-message detection happens in the Android app and synced transactions show here."
        }
        className="composer-panel"
      >
        <div className="sync-card sync-card--full">
          <div className="sync-card__icon">
            <ScanText size={18} />
          </div>
          <div className="sync-card__content">
            <strong>{isAndroidNative ? "Incoming transaction alerts are checked automatically" : "SMS pasting is not part of this product"}</strong>
            <p>
              {isAndroidNative
                ? "When a new bank or card message arrives, SmartBudget decides whether it is a debit or credit and updates the ledger if it is real transaction activity."
                : "Users do not paste messages here. Install and use the Android app to detect incoming bank SMS automatically, then review the synced ledger on the web."}
            </p>
          </div>
        </div>

        <div className="composer-meta">
          <div className="composer-meta__field">
            <span>Status</span>
            <strong>{isAndroidNative ? "Live monitoring enabled" : "Android sync required"}</strong>
          </div>
          <div className="composer-meta__field">
            <span>Fallback</span>
            <strong>Manual cash entry below</strong>
          </div>
        </div>

        <div className="button-row button-row--tight">
          {isAndroidNative ? (
            <button className="button button--secondary" type="button" onClick={onImportNativeSms} disabled={isImportingNativeSms}>
              <ScanText size={16} />
              {isImportingNativeSms ? "Scanning..." : "Scan existing inbox"}
            </button>
          ) : null}
          <button className="button button--ghost" type="button" onClick={() => onSetScreen("dashboard")}>
            <ArrowRightLeft size={16} />
            Back Home
          </button>
        </div>
      </Panel>

      <Panel
        title="Manual Debit / Credit"
        subtitle={
          isAndroidNative
            ? "Use this when money moves without a bank SMS, such as cash spend or an offline credit."
            : "Use this for cash, hand-to-hand transfers, or anything that did not come through SMS."
        }
        className="composer-panel"
      >
        <div className="segment-switch">
          <button
            className={`segment-switch__button ${manualDraft.kind === "expense" ? "segment-switch__button--active" : ""}`}
            type="button"
            onClick={() => setManualDraft((current) => ({ ...current, kind: "expense" }))}
          >
            Debit
          </button>
          <button
            className={`segment-switch__button ${manualDraft.kind === "income" ? "segment-switch__button--active" : ""}`}
            type="button"
            onClick={() => setManualDraft((current) => ({ ...current, kind: "income" }))}
          >
            Credit
          </button>
        </div>

        <div className="amount-panel">
          <span>Amount</span>
          <strong>{manualAmountDisplay}</strong>
        </div>

        <div className="category-tile-grid">
          {transactionCategoryTiles.map((tile) => {
            const Icon = tile.icon;
            const active = selectedManualTileId === tile.id;

            return (
              <button
                className={`category-tile ${active ? "category-tile--active" : ""}`}
                type="button"
                key={tile.id}
                onClick={() => {
                  setSelectedManualTileId(tile.id);
                  setManualDraft((current) => ({ ...current, category: tile.category }));
                }}
              >
                <div className="category-tile__icon">
                  <Icon size={18} />
                </div>
                <span>{tile.label}</span>
              </button>
            );
          })}
        </div>

        <div className="manual-grid">
          <label className="field">
            <span>Merchant / Note</span>
            <input
              className="input"
              type="text"
              value={manualDraft.merchant}
              onChange={(event) => setManualDraft((current) => ({ ...current, merchant: event.target.value }))}
              placeholder={manualDraft.kind === "income" ? "Scholarship, salary, refund..." : "Cash spend, kiosk, bus fare..."}
            />
          </label>

          <label className="field">
            <span>Amount</span>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={manualDraft.amount > 0 ? String(manualDraft.amount) : ""}
              onChange={(event) =>
                setManualDraft((current) => ({
                  ...current,
                  amount: event.target.value ? Number(event.target.value) : 0,
                }))
              }
              placeholder="0.00"
            />
          </label>

          <label className="field">
            <span>Date</span>
            <input
              className="input"
              type="date"
              value={manualDraft.date}
              onChange={(event) => setManualDraft((current) => ({ ...current, date: event.target.value }))}
            />
          </label>

          <label className="field">
            <span>Currency</span>
            <select
              className="input"
              value={manualDraft.currency}
              onChange={(event) =>
                setManualDraft((current) => ({
                  ...current,
                  currency: event.target.value as CurrencyCode,
                }))
              }
            >
              <option value="TRY">TRY</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
        </div>

        <div className="button-row button-row--tight">
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              const saved = onAddManualTransaction(manualDraft);
              if (saved) {
                setManualDraft(createManualDraft(manualDraft.kind));
                setSelectedManualTileId(getManualTileIdForCategory(createManualDraft(manualDraft.kind).category));
              }
            }}
          >
            <BadgeDollarSign size={16} />
            Save Manual Entry
          </button>
        </div>
      </Panel>

      <Panel
        title="Transaction List"
        subtitle={`${filtered.length} visible / ${transactions.length} total entries`}
        action={
          <button className="button button--secondary" type="button" onClick={() => onSetScreen("dashboard")}>
            Back Home
          </button>
        }
      >
        <div className="filters">
          <label className="field field--inline">
            <Search size={16} />
            <input
              className="input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search merchant, SMS text, or category"
            />
          </label>

          <label className="field field--inline">
            <Filter size={16} />
            <select className="input" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as Category | "all")}>
              <option value="all">All categories</option>
              {transactionCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="field field--inline">
            <Menu size={16} />
            <select
              className="input"
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value as Transaction["source"] | "all")}
            >
              <option value="all">All sources</option>
              <option value="sms">SMS</option>
              <option value="manual">Manual</option>
            </select>
          </label>
        </div>
      </Panel>

      <Panel title="Ledger" subtitle="Click the merchant or category to correct any misclassified transaction details.">
        <div className="table-wrap">
          {filtered.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Merchant</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Source</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{formatDateLabel(transaction.date)}</td>
                    <td>
                      {editingMerchantId === transaction.id ? (
                        <input
                          className="input ledger-edit-input"
                          type="text"
                          value={merchantDraft}
                          autoFocus
                          onChange={(event) => setMerchantDraft(event.target.value)}
                          onBlur={() => commitMerchantEdit(transaction.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              commitMerchantEdit(transaction.id);
                            }

                            if (event.key === "Escape") {
                              event.preventDefault();
                              stopMerchantEdit();
                            }
                          }}
                        />
                      ) : (
                        <button className="ledger-edit-trigger" type="button" onClick={() => startMerchantEdit(transaction)}>
                          <strong>{transaction.merchant}</strong>
                        </button>
                      )}
                    </td>
                    <td className={transaction.kind === "income" ? "positive" : "negative"}>
                      {transaction.kind === "income" ? "+" : "-"}
                      {formatMoney(transaction.amount, transaction.currency)}
                    </td>
                    <td>
                      {editingCategoryId === transaction.id ? (
                        <select
                          className="input ledger-edit-input ledger-edit-select"
                          value={transaction.category}
                          autoFocus
                          onBlur={() => setEditingCategoryId(null)}
                          onChange={(event) => commitCategoryEdit(transaction.id, event.target.value as Category)}
                        >
                          {transactionCategories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          className="category-pill category-pill--editable"
                          type="button"
                          onClick={() => {
                            setEditingMerchantId(null);
                            setEditingCategoryId(transaction.id);
                          }}
                          style={{ background: `${CATEGORY_COLORS[transaction.category]}20`, color: CATEGORY_COLORS[transaction.category] }}
                        >
                          {transaction.category}
                        </button>
                      )}
                    </td>
                    <td>
                      <Badge tone={transaction.source === "sms" ? "success" : "neutral"}>
                        {transaction.source.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="table-actions">
                      <button className="icon-button" type="button" onClick={() => onDeleteTransaction(transaction.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              title={transactions.length === 0 ? "Your ledger is empty" : "Nothing matches your filters"}
              description={
                transactions.length === 0
                  ? isAndroidNative
                    ? "Wait for the first bank SMS or add a manual cash entry above."
                    : "Sync transactions from the Android app or add a manual debit or credit above to create the first entry."
                  : "Try clearing the search bar or sync another transaction."
              }
            />
          )}
        </div>
      </Panel>
    </div>
  );
}

export function AnalysisScreen({
  summary,
  categoryBreakdown,
  monthlyTrend,
  yearlyTrend,
  weeklyTrend,
  insights,
}: {
  summary: FinancialSummary;
  categoryBreakdown: ReturnType<typeof buildCategoryBreakdown>;
  monthlyTrend: ReturnType<typeof buildMonthlyTrend>;
  yearlyTrend: ReturnType<typeof buildMonthlyTrend>;
  weeklyTrend: Array<{ label: string; value: number }>;
  insights: string[];
}) {
  const [range, setRange] = useState<"week" | "month" | "year" | "custom">("week");
  const monthlyExpenseTrend = monthlyTrend.map((entry) => ({ label: entry.label, value: entry.expenses }));
  const yearlyExpenseTrend = yearlyTrend.map((entry) => ({ label: entry.label, value: entry.expenses }));
  const customTrend = yearlyTrend.slice(-6).map((entry) => ({ label: entry.label, value: Math.max(entry.balance, 0) }));
  const chartData =
    range === "week" ? weeklyTrend : range === "month" ? monthlyExpenseTrend : range === "year" ? yearlyExpenseTrend : customTrend;
  const previousPoint = chartData[chartData.length - 2]?.value ?? 0;
  const latestPoint = chartData[chartData.length - 1]?.value ?? 0;
  const trendDelta = previousPoint > 0 ? ((latestPoint - previousPoint) / previousPoint) * 100 : 0;

  return (
    <div className="screen-stack">
      <Panel title="Statistics" subtitle="Track spending trends across your most recent activity." className="stats-panel">
        <div className="segment-switch segment-switch--wide">
          {[
            { key: "week", label: "Week" },
            { key: "month", label: "Month" },
            { key: "year", label: "Year" },
            { key: "custom", label: "Custom" },
          ].map((option) => (
            <button
              className={`segment-switch__button ${range === option.key ? "segment-switch__button--active" : ""}`}
              key={option.key}
              type="button"
              onClick={() => setRange(option.key as typeof range)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="stats-headline">
          <div>
            <strong>Spending Trends</strong>
            <span>{range === "week" ? "Recent weekly outflow" : range === "month" ? "Monthly expenses" : "Long-range expense pattern"}</span>
          </div>
          <b className={trendDelta > 0 ? "negative" : "positive"}>
            {previousPoint > 0 ? `${trendDelta > 0 ? "+" : "-"}${Math.abs(trendDelta).toFixed(0)}%` : "0%"}
          </b>
        </div>

        <ChartFrame height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid stroke="rgba(255,253,2,0.12)" vertical={false} />
              <XAxis dataKey="label" {...chartAxisProps} />
              <YAxis {...chartAxisProps} tickFormatter={(value) => formatMoney(Number(value))} />
              <Tooltip {...chartTooltipStyle} formatter={(value) => [formatMoney(Number(value)), "Spend"]} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`${entry.label}-${index}`}
                    fill={index % 4 === 0 ? "#fffd02" : index % 4 === 1 ? "#2db7ff" : index % 4 === 2 ? "#ff4fd8" : "#93ff00"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <div className="stats-note">
          <span className="stats-note__dot" />
          <p>{insights[1] ?? "Import more transactions to sharpen the comparison."}</p>
        </div>
      </Panel>

      <Panel title="Category Breakdown" subtitle="The categories currently carrying most of the spend.">
        {categoryBreakdown.length > 0 ? (
          <div className="category-breakdown-list">
            {categoryBreakdown.map((entry) => {
              const Icon = categoryIconMap[entry.category] ?? ShoppingBag;

              return (
                <div className="breakdown-row" key={entry.category}>
                  <div className="breakdown-row__icon" style={{ color: entry.color }}>
                    <Icon size={18} />
                  </div>
                  <div className="breakdown-row__body">
                    <div className="breakdown-row__meta">
                      <div>
                        <strong>{entry.category}</strong>
                        <span>{formatPercent(entry.share)} of total</span>
                      </div>
                      <div className="breakdown-row__amount">
                        <strong>{formatMoney(entry.amount)}</strong>
                        <span className={entry.share > 30 ? "negative" : "positive"}>{entry.share > 30 ? "High" : "Stable"}</span>
                      </div>
                    </div>
                    <div className="mini-progress mini-progress--colored">
                      <span style={{ width: `${entry.share}%`, background: entry.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No breakdown yet" description="Once expenses are imported, category pressure appears here." />
        )}
      </Panel>
    </div>
  );
}

export function SmartSaveScreen({
  summary,
  goalProgress,
  safeSavings,
  protectedSavings,
  convertedSavings,
  projection,
  targetCurrency,
  smartSaveGoal,
  onUpdateGoal,
  onUpdateTargetCurrency,
}: {
  summary: FinancialSummary;
  goalProgress: number;
  safeSavings: number;
  protectedSavings: number;
  convertedSavings: number;
  projection: ReturnType<typeof projectSavings>;
  targetCurrency: CurrencyCode;
  smartSaveGoal: number;
  onUpdateGoal: (value: number) => void;
  onUpdateTargetCurrency: (value: CurrencyCode) => void;
}) {
  const projectedYear = projection[projection.length - 1];
  const projectionFiveYears = projectedYear.tryValue + summary.cashFlow * 48;
  const [manualAmount, setManualAmount] = useState(String(Math.max(200, Math.round(protectedSavings || 200))));
  const manualNumber = Number(manualAmount);
  const manualConverted = Number.isFinite(manualNumber) ? convertCurrency(manualNumber, targetCurrency) : 0;

  return (
    <div className="screen-stack">
      <section className="hero-strip panel">
        <div className="hero-strip__copy">
          <p className="eyebrow">Value protection</p>
          <h2>{formatMoney(safeSavings)} available to protect</h2>
          <p>
            Smart Save+ simulates moving spare cash into stable currency buckets so savings are less exposed to local
            currency swings.
          </p>
        </div>
        <div className="hero-strip__stack">
          <div className="summary-chip">
            <span>Goal progress</span>
            <strong>{formatPercent(goalProgress)}</strong>
          </div>
          <div className="summary-chip summary-chip--accent">
            <span>Protected value</span>
            <strong>{formatMoney(protectedSavings)}</strong>
          </div>
        </div>
      </section>

      <section className="chart-grid">
        <Panel title="Conversion simulator" subtitle="Choose a stable currency and see the result instantly.">
          <div className="stack">
            <div className="converter-grid">
              <label className="field">
                <span>Amount in TL</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step="1"
                  value={manualAmount}
                  onChange={(event) => setManualAmount(event.target.value)}
                />
              </label>
              <label className="field">
                <span>Target currency</span>
                <select className="input" value={targetCurrency} onChange={(event) => onUpdateTargetCurrency(event.target.value as CurrencyCode)}>
                  {targetCurrencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="converter-result">
              <span>Estimated value</span>
              <strong>
                {manualConverted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {targetCurrency}
              </strong>
              <p>No real money transfer occurs in this prototype.</p>
            </div>

            <button
              className="button button--secondary"
              type="button"
              onClick={() => setManualAmount(String(Math.max(200, Math.round(protectedSavings || 200))))}
            >
              <ArrowRightLeft size={16} />
              Use available savings
            </button>
          </div>
        </Panel>

        <Panel title="Projected growth" subtitle="Protected value over the next 12 months.">
          <ChartFrame height={320}>
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projection}>
                <CartesianGrid stroke="rgba(255,253,2,0.12)" vertical={false} />
                <XAxis dataKey="label" stroke="#d5cc8a" {...chartAxisProps} />
                <YAxis stroke="#d5cc8a" {...chartAxisProps} tickFormatter={(value) => formatMoney(Number(value))} />
                <Tooltip {...chartTooltipStyle} formatter={(value) => [formatMoney(Number(value)), "Projected value"]} />
                <Line type="monotone" dataKey="tryValue" stroke="#fffd02" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartFrame>
        </Panel>
      </section>

      <section className="dashboard-grid dashboard-grid--bottom">
        <Panel title="Goal controls" subtitle="Tune the monthly savings objective for the app.">
          <div className="stack">
            <label className="field">
              <span>Goal amount (TL)</span>
              <input
                className="input"
                type="range"
                min={100}
                max={5000}
                step={50}
                value={smartSaveGoal}
                onChange={(event) => onUpdateGoal(Number(event.target.value))}
              />
            </label>
            <div className="range-value-row">
              <span>Current goal</span>
              <strong>{formatMoney(smartSaveGoal)}</strong>
            </div>
            <div className="goal-progress">
              <span style={{ width: `${goalProgress}%` }} />
            </div>
          </div>
        </Panel>

        <Panel title="Value projection summary" subtitle="What the current amount could become.">
          <div className="summary-grid">
            <div className="summary-card">
              <span>Current savings</span>
              <strong>{formatMoney(safeSavings)}</strong>
            </div>
            <div className="summary-card">
              <span>Protected now</span>
              <strong>{formatMoney(protectedSavings)}</strong>
            </div>
            <div className="summary-card">
              <span>Converted now</span>
              <strong>
                {convertedSavings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                {targetCurrency}
              </strong>
            </div>
            <div className="summary-card">
              <span>5-year outlook</span>
              <strong>{formatMoney(projectionFiveYears)}</strong>
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}

export function AdviceScreen({
  summary,
  adviceCards,
  insights,
  defaultWhatIfAmountUsd,
  isBackedBySavings,
  isRefreshingAdvice,
  onRefreshAdvice,
}: {
  summary: FinancialSummary;
  adviceCards: AdviceCard[];
  insights: string[];
  defaultWhatIfAmountUsd: number;
  isBackedBySavings: boolean;
  isRefreshingAdvice: boolean;
  onRefreshAdvice: () => void;
}) {
  const [whatIfPeriod, setWhatIfPeriod] = useState<WhatIfPeriod>("3m");
  const [amountInput, setAmountInput] = useState(() => formatAmountInput(defaultWhatIfAmountUsd));
  const [committedAmount, setCommittedAmount] = useState(() => normalizeWhatIfAmount(defaultWhatIfAmountUsd));
  const [whatIfScenario, setWhatIfScenario] = useState<WhatIfScenario | null>(null);
  const [whatIfError, setWhatIfError] = useState<string | null>(null);
  const [isLoadingWhatIf, setIsLoadingWhatIf] = useState(false);

  useEffect(() => {
    const amount = normalizeWhatIfAmount(committedAmount);

    if (amount <= 0) {
      setWhatIfScenario(null);
      setWhatIfError("Enter a simulation amount greater than zero.");
      return;
    }

    let cancelled = false;

    async function loadScenario() {
      setIsLoadingWhatIf(true);
      setWhatIfError(null);

      try {
        const response = await fetch(`/api/markets/what-if?period=${whatIfPeriod}&amount=${amount}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(typeof payload?.error === "string" ? payload.error : "Unable to load the what-if scenario.");
        }

        if (!cancelled) {
          setWhatIfScenario(payload as WhatIfScenario);
        }
      } catch (error) {
        if (!cancelled) {
          setWhatIfScenario(null);
          setWhatIfError(error instanceof Error ? error.message : "Unable to load the what-if scenario.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingWhatIf(false);
        }
      }
    }

    void loadScenario();

    return () => {
      cancelled = true;
    };
  }, [committedAmount, whatIfPeriod]);

  function applyWhatIfAmount() {
    const nextAmount = Number(amountInput);

    if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
      setWhatIfError("Enter a simulation amount greater than zero.");
      return;
    }

    const normalized = normalizeWhatIfAmount(nextAmount);
    setCommittedAmount(normalized);
    setAmountInput(formatAmountInput(normalized));
  }

  return (
    <div className="screen-stack">
      <section className="hero-strip panel">
        <div className="hero-strip__copy">
          <p className="eyebrow">AI recommendation</p>
          <h2>{Math.round(summary.healthScore)} score is the starting point for the next move.</h2>
          <p>Generate fresh advice cards whenever the transaction mix changes.</p>
        </div>
        <button className="button button--primary" type="button" onClick={onRefreshAdvice} disabled={isRefreshingAdvice}>
          <BrainCircuit size={16} />
          {isRefreshingAdvice ? "Generating..." : "Generate AI advice"}
        </button>
      </section>

      <section className="advice-grid">
        {adviceCards.map((card) => (
          <article className={`advice-card advice-card--${card.type}`} key={`${card.title}-${card.description}`}>
            <Badge tone={card.type}>{card.type}</Badge>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </article>
        ))}
      </section>

      <Panel title="What If You Invested?" subtitle="See what your money would be worth today if it had been placed into the strongest performer in our tracked market basket.">
        <div className="stack">
          <div className="segment-switch segment-switch--wide">
            {[
              { key: "1m", label: "1 Month" },
              { key: "3m", label: "3 Months" },
              { key: "6m", label: "6 Months" },
              { key: "1y", label: "1 Year" },
            ].map((option) => (
              <button
                className={`segment-switch__button ${whatIfPeriod === option.key ? "segment-switch__button--active" : ""}`}
                key={option.key}
                type="button"
                onClick={() => setWhatIfPeriod(option.key as WhatIfPeriod)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="what-if-controls">
            <label className="field">
              <span>Simulation amount (USD)</span>
              <input
                className="input"
                type="number"
                min={1}
                step="1"
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value)}
              />
            </label>
            <button className="button button--secondary" type="button" onClick={applyWhatIfAmount} disabled={isLoadingWhatIf}>
              {isLoadingWhatIf ? "Running..." : "Run What If"}
            </button>
          </div>

          <p className="helper-copy">
            {isBackedBySavings
              ? "This starts with your current protected savings converted to USD. Change the amount to test a different scenario."
              : "No protected savings are available yet, so the simulation starts with a manual USD amount."}
          </p>

          {whatIfScenario ? (
            <div className="what-if-panel">
              <div className="what-if-panel__hero">
                <div>
                  <span className="eyebrow">Best Performer</span>
                  <h3>{whatIfScenario.bestAsset.name}</h3>
                  <p>
                    {whatIfScenario.bestAsset.symbol} · {whatIfScenario.bestAsset.category} · {whatIfScenario.periodLabel}
                  </p>
                </div>
                <strong className={whatIfScenario.bestAsset.gain >= 0 ? "positive" : "negative"}>
                  {whatIfScenario.bestAsset.gain >= 0 ? "+" : "-"}
                  {formatMoney(Math.abs(whatIfScenario.bestAsset.gain), "USD")}
                </strong>
              </div>

              <div className="summary-grid">
                <div className="summary-card">
                  <span>Invested</span>
                  <strong>{formatMoney(whatIfScenario.amount, "USD")}</strong>
                </div>
                <div className="summary-card">
                  <span>Worth Now</span>
                  <strong>{formatMoney(whatIfScenario.bestAsset.currentValue, "USD")}</strong>
                </div>
                <div className="summary-card">
                  <span>Return</span>
                  <strong className={whatIfScenario.bestAsset.returnPct >= 0 ? "positive" : "negative"}>
                    {whatIfScenario.bestAsset.returnPct >= 0 ? "+" : "-"}
                    {Math.abs(whatIfScenario.bestAsset.returnPct).toFixed(1)}%
                  </strong>
                </div>
                <div className="summary-card">
                  <span>Window</span>
                  <strong>
                    {formatDateLabel(whatIfScenario.startDate)} to {formatDateLabel(whatIfScenario.endDate)}
                  </strong>
                </div>
              </div>

              <div className="category-breakdown-list">
                {whatIfScenario.assets.slice(0, 4).map((asset) => (
                  <div className="breakdown-row" key={`${asset.symbol}-${asset.startDate}`}>
                    <div className="breakdown-row__icon">
                      <TrendingUp size={18} />
                    </div>
                    <div className="breakdown-row__body">
                      <div className="breakdown-row__meta">
                        <div>
                          <strong>{asset.name}</strong>
                          <span>{asset.category}</span>
                        </div>
                        <div className="breakdown-row__amount">
                          <strong>{formatMoney(asset.currentValue, "USD")}</strong>
                          <span className={asset.returnPct >= 0 ? "positive" : "negative"}>
                            {asset.returnPct >= 0 ? "+" : "-"}
                            {Math.abs(asset.returnPct).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="mini-progress mini-progress--colored">
                        <span
                          style={{
                            width: `${Math.max(8, Math.min(100, Math.abs(asset.returnPct)))}%`,
                            background: asset.returnPct >= 0 ? "#fffd02" : "#ff4fd8",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="helper-copy">{whatIfScenario.disclaimer}</p>
            </div>
          ) : null}

          {whatIfError ? <div className="auth-note auth-note--signup">{whatIfError}</div> : null}
        </div>
      </Panel>

      <section className="dashboard-grid dashboard-grid--bottom">
        <Panel title="Behavior snapshot" subtitle="The three signals the model currently considers most important.">
          <div className="insight-list">
            {insights.map((insight) => (
              <div className="insight-row" key={insight}>
                <ArrowUpRight size={16} />
                <p>{insight}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Recommended playbook" subtitle="Simple actions that can be completed this week.">
          <div className="playbook">
            <div className="playbook__step">
              <CheckCircle2 size={16} />
              <span>Cap one category with a weekly amount.</span>
            </div>
            <div className="playbook__step">
              <CheckCircle2 size={16} />
              <span>Move the next savings surplus into Smart Save+.</span>
            </div>
            <div className="playbook__step">
              <CheckCircle2 size={16} />
              <span>Review the ledger after the next five SMS imports.</span>
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function normalizeWhatIfAmount(value: number) {
  return Number.isFinite(value) ? Math.max(1, Math.round(value * 100) / 100) : 100;
}

function formatAmountInput(value: number) {
  const normalized = normalizeWhatIfAmount(value);
  return normalized.toFixed(2).replace(/\.00$/, "");
}
