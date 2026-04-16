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
  Send,
  ShoppingBag,
  Target,
  Trash2,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { Bar, BarChart, Cell, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { demoSmsSamples, targetCurrencies } from "../lib/demo";
import {
  buildCategoryBreakdown,
  buildMonthlyTrend,
  convertCurrency,
  formatDateLabel,
  formatMoney,
  formatPercent,
  parseSmsTransaction,
  projectSavings,
  CATEGORY_COLORS,
} from "../lib/finance";
import type { AdviceCard, Category, CurrencyCode, FinancialSummary, ScreenKey, Transaction, WhatIfPeriod, WhatIfScenario } from "../types";
import { Badge, ChartFrame, EmptyState, HealthDial, MetricCard, Panel } from "./shared";

const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: "rgba(11,16,28,0.96)",
    border: "1px solid rgba(78,124,255,0.18)",
    borderRadius: 18,
    boxShadow: "0 20px 36px rgba(0,0,0,0.42)",
    color: "#f8fbff",
  },
  labelStyle: {
    color: "#9aa4c4",
    fontWeight: 700,
  },
  itemStyle: {
    color: "#f8fbff",
  },
  cursor: {
    fill: "rgba(78,124,255,0.08)",
  },
};

const chartAxisProps = {
  axisLine: false,
  tickLine: false,
  tick: { fill: "#7f8bab", fontSize: 11 },
};

const categoryIconMap = {
  Supermarket: UtensilsCrossed,
  Transport: BusFront,
  Entertainment: Clapperboard,
  Bills: Receipt,
  Education: GraduationCap,
  Other: ShoppingBag,
} as const;

export function DashboardScreen({
  summary,
  categoryBreakdown,
  monthlyTrend,
  recentTransactions,
  allowDemoTools,
  insights,
  isAndroidNative,
  smsDraft,
  setSmsDraft,
  goalProgress,
  safeSavings,
  isAnalyzingSms,
  isImportingNativeSms,
  onAnalyzeSms,
  onFillSampleSms,
  onImportNativeSms,
  onSetScreen,
}: {
  summary: FinancialSummary;
  categoryBreakdown: ReturnType<typeof buildCategoryBreakdown>;
  monthlyTrend: ReturnType<typeof buildMonthlyTrend>;
  recentTransactions: Transaction[];
  allowDemoTools: boolean;
  insights: string[];
  isAndroidNative: boolean;
  smsDraft: string;
  setSmsDraft: (value: string) => void;
  goalProgress: number;
  safeSavings: number;
  isAnalyzingSms: boolean;
  isImportingNativeSms: boolean;
  onAnalyzeSms: () => void;
  onFillSampleSms: (value: string) => void;
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
        <Panel title="Quick Import" subtitle="Turn a bank SMS into a transaction.">
          <div className="stack">
            <div className="button-row button-row--tight">
              {allowDemoTools ? (
                <button className="button button--secondary" type="button" onClick={() => onFillSampleSms(demoSmsSamples[0])} disabled={isImportingNativeSms}>
                  Sample SMS
                </button>
              ) : null}
              {isAndroidNative ? (
                <button className="button button--secondary" type="button" onClick={onImportNativeSms} disabled={isImportingNativeSms}>
                  <ScanText size={16} />
                  {isImportingNativeSms ? "Importing..." : "Import phone SMS"}
                </button>
              ) : null}
            </div>
            <textarea
              className="textarea textarea--compact"
              value={smsDraft}
              onChange={(event) => setSmsDraft(event.target.value)}
              rows={4}
              placeholder="Paste a real bank SMS or card alert..."
            />
            <div className="button-row button-row--tight">
              <button className="button button--primary" type="button" onClick={onAnalyzeSms} disabled={isAnalyzingSms}>
                <Send size={16} />
                {isAnalyzingSms ? "Analyzing..." : "Analyze SMS"}
              </button>
              <button className="button button--ghost" type="button" onClick={() => onSetScreen("transactions")}>
                <ReceiptText size={16} />
                Open Add Screen
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
            <EmptyState title="No transactions yet" description="Your first SMS import will appear here." />
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
  allowDemoTools,
  smsDraft,
  setSmsDraft,
  isAnalyzingSms,
  isAndroidNative,
  isImportingNativeSms,
  onDeleteTransaction,
  onFillSampleSms,
  onAnalyzeSms,
  onImportNativeSms,
  onSetScreen,
}: {
  transactions: Transaction[];
  allowDemoTools: boolean;
  smsDraft: string;
  setSmsDraft: (value: string) => void;
  isAnalyzingSms: boolean;
  isAndroidNative: boolean;
  isImportingNativeSms: boolean;
  onDeleteTransaction: (id: string) => void;
  onFillSampleSms: (value: string) => void;
  onAnalyzeSms: () => void;
  onImportNativeSms: () => void;
  onSetScreen: (screen: ScreenKey) => void;
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<Transaction["source"] | "all">("all");
  const parsedDraft = smsDraft.trim() ? parseSmsTransaction(smsDraft) : null;
  const activeKind = parsedDraft?.kind === "income" ? "income" : "expense";
  const categoryTiles = [
    { label: "Food", category: "Supermarket" as const, icon: UtensilsCrossed },
    { label: "Transport", category: "Transport" as const, icon: BusFront },
    { label: "Shopping", category: "Other" as const, icon: ShoppingBag },
    { label: "Bills", category: "Bills" as const, icon: Receipt },
    { label: "Entertainment", category: "Entertainment" as const, icon: Clapperboard },
    { label: "Health", category: "Other" as const, icon: HeartPulse },
    { label: "Home", category: "Bills" as const, icon: House },
    { label: "Education", category: "Education" as const, icon: GraduationCap },
  ];

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
      <Panel title="Transaction Composer" subtitle="Analyze an SMS, preview the category, then add it to the ledger." className="composer-panel">
        <div className="segment-switch">
          <button className={`segment-switch__button ${activeKind === "expense" ? "segment-switch__button--active" : ""}`} type="button">
            Expense
          </button>
          <button className={`segment-switch__button ${activeKind === "income" ? "segment-switch__button--active" : ""}`} type="button">
            Income
          </button>
        </div>

        <div className="amount-panel">
          <span>Amount</span>
          <strong>{parsedDraft ? formatMoney(parsedDraft.amount, parsedDraft.currency) : formatMoney(0)}</strong>
        </div>

        <div className="category-tile-grid">
          {categoryTiles.map((tile) => {
            const Icon = tile.icon;
            const active = parsedDraft?.category === tile.category;

            return (
              <div className={`category-tile ${active ? "category-tile--active" : ""}`} key={`${tile.label}-${tile.category}`}>
                <div className="category-tile__icon">
                  <Icon size={18} />
                </div>
                <span>{tile.label}</span>
              </div>
            );
          })}
        </div>

        <label className="field">
          <span>Description</span>
          <textarea
            className="textarea textarea--compact"
            value={smsDraft}
            onChange={(event) => setSmsDraft(event.target.value)}
            rows={4}
            placeholder="Paste your bank SMS here..."
          />
        </label>

        <div className="composer-meta">
          <div className="composer-meta__field">
            <span>Date</span>
            <strong>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</strong>
          </div>
          <div className="composer-meta__field">
            <span>Payment Method</span>
            <strong>{parsedDraft ? (parsedDraft.kind === "income" ? "Transfer" : "Card / SMS") : "Pending"}</strong>
          </div>
        </div>

        <div className="button-row button-row--tight">
          <button className="button button--primary" type="button" onClick={onAnalyzeSms} disabled={isAnalyzingSms}>
            <Send size={16} />
            {isAnalyzingSms ? "Analyzing..." : "Add Transaction"}
          </button>
          {isAndroidNative ? (
            <button className="button button--secondary" type="button" onClick={onImportNativeSms} disabled={isImportingNativeSms}>
              <ScanText size={16} />
              {isImportingNativeSms ? "Importing..." : "Phone SMS"}
            </button>
          ) : null}
          {allowDemoTools ? (
            <button className="button button--ghost" type="button" onClick={() => onFillSampleSms(demoSmsSamples[0])}>
              Sample SMS
            </button>
          ) : null}
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
              {["Supermarket", "Transport", "Entertainment", "Bills", "Education", "Other"].map((category) => (
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

      <Panel title="Ledger" subtitle="Each transaction is color-coded and auto-tagged by category.">
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
                      <strong>{transaction.merchant}</strong>
                    </td>
                    <td className={transaction.kind === "income" ? "positive" : "negative"}>
                      {transaction.kind === "income" ? "+" : "-"}
                      {formatMoney(transaction.amount, transaction.currency)}
                    </td>
                    <td>
                      <span
                        className="category-pill"
                        style={{ background: `${CATEGORY_COLORS[transaction.category]}20`, color: CATEGORY_COLORS[transaction.category] }}
                      >
                        {transaction.category}
                      </span>
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
                  ? "Import a real bank SMS from the dashboard to create the first entry."
                  : "Try clearing the search bar or importing another SMS transaction."
              }
              action={
                allowDemoTools && transactions.length === 0 ? (
                  <button className="button button--primary" type="button" onClick={() => onFillSampleSms(demoSmsSamples[0])}>
                    <ScanText size={16} />
                    Load sample SMS
                  </button>
                ) : undefined
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
              <CartesianGrid stroke="rgba(127,139,171,0.12)" vertical={false} />
              <XAxis dataKey="label" {...chartAxisProps} />
              <YAxis {...chartAxisProps} tickFormatter={(value) => formatMoney(Number(value))} />
              <Tooltip {...chartTooltipStyle} formatter={(value) => [formatMoney(Number(value)), "Spend"]} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`${entry.label}-${index}`}
                    fill={index % 4 === 2 ? "#9dc7ff" : index % 3 === 0 ? "#70abff" : "#4d84ff"}
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
                <CartesianGrid stroke="#e7edf4" vertical={false} />
                <XAxis dataKey="label" stroke="#cbd5e1" {...chartAxisProps} />
                <YAxis stroke="#cbd5e1" {...chartAxisProps} tickFormatter={(value) => formatMoney(Number(value))} />
                <Tooltip {...chartTooltipStyle} formatter={(value) => [formatMoney(Number(value)), "Projected value"]} />
                <Line type="monotone" dataKey="tryValue" stroke="#54f1a3" strokeWidth={3} dot={false} />
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
                            background: asset.returnPct >= 0 ? "#4c84ff" : "#ff6b86",
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
