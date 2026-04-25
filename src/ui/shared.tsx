import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Eye,
  EyeOff,
  LayoutDashboard,
  Menu,
  PiggyBank,
  PieChart,
  ReceiptText,
  Sparkles,
} from "lucide-react";
import type { AdviceCard, FinancialSummary, ScreenKey } from "../types";
import { clamp, formatMoney, formatPercent } from "../lib/finance";

export type BadgeTone = "success" | "warning" | "error" | "neutral";
export type ToastTone = BadgeTone;

export const NAV_ITEMS: { key: ScreenKey; label: string; icon: LucideIcon }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "transactions", label: "Transactions", icon: ReceiptText },
  { key: "analysis", label: "Analysis", icon: PieChart },
  { key: "save", label: "Smart Save+", icon: PiggyBank },
  { key: "advice", label: "AI Advice", icon: Sparkles },
];

export const SCREEN_COPY: Record<ScreenKey, { eyebrow: string; title: string; subtitle: string }> = {
  dashboard: {
    eyebrow: "Overview",
    title: "Financial cockpit",
    subtitle: "SMS, email imports, savings health, and AI categorization in one command center.",
  },
  transactions: {
    eyebrow: "Ledger",
    title: "Auto-tagged transactions",
    subtitle: "Review SMS, email, and manual entries while keeping the dataset clean.",
  },
  analysis: {
    eyebrow: "Insights",
    title: "Where your money goes",
    subtitle: "See category pressure, weekly drift, and the habits shaping your balance.",
  },
  save: {
    eyebrow: "Smart Save+",
    title: "Protect savings value",
    subtitle: "Simulate safe conversions into stable currencies and project future growth.",
  },
  advice: {
    eyebrow: "AI coach",
    title: "Smart recommendations",
    subtitle: "Turn the current cash flow picture into concrete next actions.",
  },
  profile: {
    eyebrow: "Account",
    title: "Profile and support",
    subtitle: "Manage identity, security, sharing, and support actions from one place.",
  },
};

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`.trim()}>
      <div className="panel__header">
        <div>
          <h3 className="panel__title">{title}</h3>
          {subtitle ? <p className="panel__subtitle">{subtitle}</p> : null}
        </div>
        {action ? <div className="panel__action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function Badge({
  tone,
  children,
}: {
  tone: BadgeTone;
  children: ReactNode;
}) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function PasswordField({
  icon: Icon,
  variant = "default",
  className = "",
  inputClassName = "input",
  ...inputProps
}: {
  icon?: LucideIcon;
  variant?: "default" | "dark";
  className?: string;
  inputClassName?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={`password-field password-field--${variant} ${className}`.trim()}>
      {Icon ? <Icon size={16} className="password-field__icon" /> : null}
      <input {...inputProps} className={inputClassName} type={isVisible ? "text" : "password"} />
      <button
        className="password-field__toggle"
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        disabled={Boolean(inputProps.disabled)}
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
      >
        {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        <span>{isVisible ? "Hide" : "Show"}</span>
      </button>
    </div>
  );
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  tone: "mint" | "amber" | "rose" | "sky";
}) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <div className="metric-card__top">
        <div className="metric-card__icon">
          <Icon size={18} />
        </div>
        <Badge tone="neutral">{label}</Badge>
      </div>
      <strong className="metric-card__value">{value}</strong>
      <span className="metric-card__hint">{hint}</span>
    </article>
  );
}

export function HealthDial({ score }: { score: number }) {
  const tone = score >= 75 ? "#54f1a3" : score >= 50 ? "#f0c36e" : "#ff7b7b";
  const label = score >= 75 ? "Healthy" : score >= 50 ? "Watch" : "At risk";

  return (
    <div className="dial" style={{ background: `conic-gradient(${tone} ${score}%, rgba(15,23,42,0.08) 0)` }}>
      <div className="dial__inner">
        <strong>{Math.round(score)}</strong>
        <span>/100</span>
        <em>{label}</em>
      </div>
    </div>
  );
}

export function ChartFrame({ children, height }: { children: ReactNode; height: number }) {
  return (
    <div className="chart-frame" style={{ height }}>
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <Menu size={22} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}

export function Toast({ flash }: { flash: { type: ToastTone; message: string } | null }) {
  if (!flash || !("message" in flash)) {
    return null;
  }

  return (
    <div className={`toast toast--${flash.type}`}>
      <strong>SmartBudget</strong>
      <p>{flash.message}</p>
    </div>
  );
}

export function HealthProgress({ value }: { value: number }) {
  return (
    <div className="mini-progress">
      <span style={{ width: `${clamp(value, 0, 100)}%` }} />
    </div>
  );
}

export function MoneyValue({ value, currency = "TRY" }: { value: number; currency?: string }) {
  return <>{formatMoney(value, currency)}</>;
}

export function PercentValue({ value }: { value: number }) {
  return <>{formatPercent(value)}</>;
}
