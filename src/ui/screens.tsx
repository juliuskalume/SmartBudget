import { useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRightLeft,
  ArrowUpRight,
  BadgeDollarSign,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  CircleDollarSign,
  Filter,
  Menu,
  PiggyBank,
  PieChart as PieChartIcon,
  ReceiptText,
  ScanText,
  Search,
  Send,
  Target,
  Trash2,
  TrendingUp,
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
  projectSavings,
  CATEGORY_COLORS,
} from "../lib/finance";
import type { AdviceCard, Category, CurrencyCode, FinancialSummary, ScreenKey, Transaction } from "../types";
import { Badge, ChartFrame, EmptyState, HealthDial, MetricCard, Panel } from "./shared";

const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: "rgba(255,255,255,0.97)",
    border: "1px solid rgba(15,109,243,0.08)",
    borderRadius: 16,
    boxShadow: "0 18px 34px rgba(15,23,42,0.12)",
    color: "#000666",
  },
  labelStyle: {
    color: "#475467",
    fontWeight: 700,
  },
  itemStyle: {
    color: "#000666",
  },
  cursor: {
    fill: "rgba(15,109,243,0.06)",
  },
};

const chartAxisProps = {
  axisLine: false,
  tickLine: false,
  tick: { fill: "#475467", fontSize: 11 },
};

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

  return (
    <div className="screen-stack">
      <section className="hero-strip panel">
        <div className="hero-strip__copy">
          <p className="eyebrow">Live dashboard</p>
          <h2>{hasTransactions ? `Health score ${Math.round(summary.healthScore)} / 100` : "Your ledger is ready for the first import."}</h2>
          <p>
            {hasTransactions
              ? "Track savings rate, expense pressure, and Smart Save+ progress before spending decisions drift off course."
              : "Paste a real bank SMS or import messages from your phone to start the dashboard with live account data."}
          </p>
          <div className="button-row">
            <button className="button button--primary" type="button" onClick={() => onSetScreen("save")}>
              <CircleDollarSign size={16} />
              Open Smart Save+
            </button>
            <button className="button button--secondary" type="button" onClick={() => onSetScreen("transactions")}>
              <ReceiptText size={16} />
              Review ledger
            </button>
          </div>
        </div>

        {hasTransactions ? (
          <div className="hero-strip__dial">
            <HealthDial score={summary.healthScore} />
          </div>
        ) : (
          <div className="hero-strip__stack">
            <div className="summary-chip">
              <span>Status</span>
              <strong>Awaiting first import</strong>
            </div>
            <div className="summary-chip summary-chip--accent">
              <span>Ledger</span>
              <strong>0 transactions</strong>
            </div>
          </div>
        )}
      </section>

      <section className="metric-grid">
        <MetricCard icon={Wallet} label="Net income" value={formatMoney(summary.totalIncome)} hint="Cash entering the budget" tone="mint" />
        <MetricCard
          icon={ArrowDownRight}
          label="Expenses"
          value={formatMoney(summary.totalExpenses)}
          hint={`${formatPercent(summary.expenseRatio)} of tracked income`}
          tone="rose"
        />
        <MetricCard
          icon={PiggyBank}
          label="Savings rate"
          value={formatPercent(summary.savingsRate)}
          hint={`${formatMoney(safeSavings)} ready for Smart Save+`}
          tone="amber"
        />
        <MetricCard icon={TrendingUp} label="Cash flow" value={formatMoney(summary.cashFlow)} hint="Income minus tracked spending" tone="sky" />
      </section>

      <section className="dashboard-grid">
        <Panel
          title="Import SMS"
          subtitle="Paste a bank alert and convert it into a transaction."
        >
          <div className="stack">
            <div className="button-row">
              {allowDemoTools ? (
                <button className="button button--secondary" type="button" onClick={() => onFillSampleSms(demoSmsSamples[0])} disabled={isImportingNativeSms}>
                  Sample SMS
                </button>
              ) : null}
              {isAndroidNative ? (
                <button className="button button--secondary" type="button" onClick={onImportNativeSms} disabled={isImportingNativeSms}>
                  <ScanText size={16} />
                  {isImportingNativeSms ? "Importing..." : "Import from phone"}
                </button>
              ) : null}
            </div>
            <textarea
              className="textarea"
              value={smsDraft}
              onChange={(event) => setSmsDraft(event.target.value)}
              rows={5}
              placeholder="Paste a real bank SMS or card alert..."
            />
            <div className="button-row">
              <button className="button button--primary" type="button" onClick={onAnalyzeSms} disabled={isAnalyzingSms}>
                <Send size={16} />
                {isAnalyzingSms ? "Analyzing..." : "Analyze SMS"}
              </button>
              <p className="helper-copy">Auto-detects merchant, amount, category, and transaction type.</p>
            </div>
          </div>
        </Panel>

        <Panel title="Financial health breakdown" subtitle="Category distribution from recent SMS imports.">
          {categoryBreakdown.length > 0 ? (
            <div className="category-bars">
              {categoryBreakdown.map((entry) => (
                <div className="category-bar" key={entry.category}>
                  <div className="category-bar__meta">
                    <span>{entry.category}</span>
                    <strong>{formatPercent(entry.share)}</strong>
                  </div>
                  <div className="mini-progress mini-progress--colored">
                    <span style={{ width: `${entry.share}%`, background: entry.color }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No spending yet" description="Import a few SMS messages to populate the pie chart." />
          )}
        </Panel>
      </section>

      <section className="chart-grid">
        <Panel title="Spending mix" subtitle="Expense categories rendered as a donut chart.">
          <ChartFrame height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip {...chartTooltipStyle} formatter={(value) => formatMoney(Number(value))} />
                <Pie
                  data={categoryBreakdown}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={76}
                  outerRadius={112}
                  paddingAngle={2}
                >
                  {categoryBreakdown.map((entry) => (
                    <Cell key={entry.category} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartFrame>
        </Panel>

        <Panel title="Monthly trend" subtitle="Income vs expenses over the last six months.">
          <ChartFrame height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid stroke="#e7edf4" vertical={false} />
                <XAxis dataKey="label" stroke="#cbd5e1" {...chartAxisProps} />
                <YAxis stroke="#cbd5e1" {...chartAxisProps} tickFormatter={(value) => formatMoney(Number(value))} />
                <Tooltip
                  {...chartTooltipStyle}
                  formatter={(value, name) => [
                    formatMoney(Number(value)),
                    name === "income" ? "Income" : name === "expenses" ? "Expenses" : "Balance",
                  ]}
                />
                <Line type="monotone" dataKey="income" stroke="#54f1a3" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="expenses" stroke="#f0c36e" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="balance" stroke="#7dd3fc" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartFrame>
        </Panel>
      </section>

      <section className="dashboard-grid dashboard-grid--bottom">
        <Panel title="Insights" subtitle="What the model is seeing right now.">
          {hasTransactions ? (
            <div className="insight-list">
              {insights.map((insight) => (
                <div className="insight-row" key={insight}>
                  <CheckCircle2 size={16} />
                  <p>{insight}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No insights yet" description="Import a few real transactions and SmartBudget will start surfacing patterns here." />
          )}
        </Panel>

        <Panel
          title="Recent imports"
          subtitle="The latest SMS-driven transactions."
          action={
            <button className="button button--ghost" type="button" onClick={() => onSetScreen("transactions")}>
              Open ledger
            </button>
          }
        >
          {latestTransactions.length > 0 ? (
            <div className="transaction-snippets">
              {latestTransactions.map((transaction) => (
                <div className="transaction-snippet" key={transaction.id}>
                  <div>
                    <strong>{transaction.merchant}</strong>
                    <span>
                      {formatDateLabel(transaction.date)} - {transaction.category} - {transaction.source.toUpperCase()}
                    </span>
                  </div>
                  <strong className={transaction.kind === "income" ? "positive" : "negative"}>
                    {transaction.kind === "income" ? "+" : "-"}
                    {formatMoney(transaction.amount, transaction.currency)}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No imports yet" description="Your ledger stays empty until you save a real SMS transaction." />
          )}
        </Panel>
      </section>

      <section className="goal-strip panel">
        <div>
          <p className="eyebrow">Smart Save+</p>
          <h3>{formatPercent(goalProgress)} of your saving goal is ready.</h3>
          <p>Move part of the surplus into stable currencies to preserve value over time.</p>
        </div>
        <button className="button button--primary" type="button" onClick={() => onSetScreen("save")}>
          <BadgeDollarSign size={16} />
          Convert savings
        </button>
      </section>
    </div>
  );
}

export function TransactionsScreen({
  transactions,
  allowDemoTools,
  onDeleteTransaction,
  onFillSampleSms,
  onSetScreen,
}: {
  transactions: Transaction[];
  allowDemoTools: boolean;
  onDeleteTransaction: (id: string) => void;
  onFillSampleSms: (value: string) => void;
  onSetScreen: (screen: ScreenKey) => void;
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<Transaction["source"] | "all">("all");

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
        title="Transaction list"
        subtitle={`${filtered.length} visible / ${transactions.length} total entries`}
        action={
          <button className="button button--secondary" type="button" onClick={() => onSetScreen("dashboard")}>
            Back to dashboard
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
  weeklyTrend,
  insights,
}: {
  summary: FinancialSummary;
  categoryBreakdown: ReturnType<typeof buildCategoryBreakdown>;
  weeklyTrend: Array<{ label: string; value: number }>;
  insights: string[];
}) {
  const highestCategory = categoryBreakdown[0];

  return (
    <div className="screen-stack">
      <section className="metric-grid">
        <MetricCard
          icon={PieChartIcon}
          label="Largest category"
          value={highestCategory ? highestCategory.category : "None"}
          hint={highestCategory ? `${formatPercent(highestCategory.share)} of expenses` : "Import SMS to reveal spend mix"}
          tone="sky"
        />
        <MetricCard icon={BarChart3} label="Debt pressure" value={formatPercent(summary.debtLevel)} hint="Bills and obligations tracked from SMS" tone="rose" />
        <MetricCard icon={TrendingUp} label="Cash flow" value={formatMoney(summary.cashFlow)} hint="Net balance after tracked spending" tone="mint" />
        <MetricCard icon={AlertTriangle} label="Expense ratio" value={formatPercent(summary.expenseRatio)} hint="Share of income currently consumed" tone="amber" />
      </section>

      <section className="chart-grid">
        <Panel title="Spending breakdown" subtitle="Expense categories rendered as a donut chart.">
          <ChartFrame height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip {...chartTooltipStyle} formatter={(value) => formatMoney(Number(value))} />
                <Pie
                  data={categoryBreakdown}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={74}
                  outerRadius={118}
                  paddingAngle={2}
                >
                  {categoryBreakdown.map((entry) => (
                    <Cell key={entry.category} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartFrame>
        </Panel>

        <Panel title="Weekly spending" subtitle="Bar chart of the last eight weeks of outflow.">
          <ChartFrame height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend}>
                <CartesianGrid stroke="#e7edf4" vertical={false} />
                <XAxis dataKey="label" stroke="#cbd5e1" {...chartAxisProps} />
                <YAxis stroke="#cbd5e1" {...chartAxisProps} tickFormatter={(value) => formatMoney(Number(value))} />
                <Tooltip {...chartTooltipStyle} formatter={(value) => [formatMoney(Number(value)), "Weekly spend"]} />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#7dd3fc" />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        </Panel>
      </section>

      <section className="dashboard-grid dashboard-grid--bottom">
        <Panel title="Insights that matter" subtitle="The current data points most likely to change behavior.">
          <div className="insight-list">
            {insights.map((insight) => (
              <div className="insight-row" key={insight}>
                <AlertTriangle size={16} />
                <p>{insight}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Category pressure" subtitle="Share of expense weight by group.">
          <div className="category-bars">
            {categoryBreakdown.map((entry) => (
              <div className="category-bar" key={entry.category}>
                <div className="category-bar__meta">
                  <span>{entry.category}</span>
                  <strong>{formatMoney(entry.amount)}</strong>
                </div>
                <div className="mini-progress mini-progress--colored">
                  <span style={{ width: `${entry.share}%`, background: entry.color }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
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
  isRefreshingAdvice,
  onRefreshAdvice,
}: {
  summary: FinancialSummary;
  adviceCards: AdviceCard[];
  insights: string[];
  isRefreshingAdvice: boolean;
  onRefreshAdvice: () => void;
}) {
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
