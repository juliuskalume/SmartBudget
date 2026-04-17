import type { FormEvent } from "react";
import {
  BadgeDollarSign,
  CheckCircle2,
  ScanText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Panel } from "./shared";
import type { CountryOption } from "../lib/country-data";

export function AuthScreen({
  mode,
  email,
  password,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  countryCode,
  countryOptions,
  onCountryChange,
  onSubmit,
  onTryDemo,
  cloudReady,
  authRedirectUrl,
  isAuthenticating,
}: {
  mode: "login" | "signup";
  email: string;
  password: string;
  onModeChange: (mode: "login" | "signup") => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  countryCode: string;
  countryOptions: CountryOption[];
  onCountryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTryDemo: () => void;
  cloudReady: boolean;
  authRedirectUrl?: string;
  isAuthenticating: boolean;
}) {
  const redirectHost = getRedirectHost(authRedirectUrl);

  return (
    <div className="auth-layout">
      <Panel title="SmartBudget" subtitle="Cloud-synced student finance assistant" className="hero-panel auth-hero">
        <div className="hero-badge">
          <img className="hero-badge__logo" src="/smartbudgetlogo.png" alt="SmartBudget logo" />
          SmartBudget
        </div>
        <h1>Manage smart. Save smarter.</h1>
        <p>
          Track student finances from bank SMS, auto-tag expenses with AI, sync everything to your account, and protect spare cash with Smart Save+.
        </p>

        <div className="hero-stats">
          <div className="hero-stat">
            <strong>SMS import</strong>
            <span>Automatic transaction capture</span>
          </div>
          <div className="hero-stat">
            <strong>AI insights</strong>
            <span>Category, trend, and advice cards</span>
          </div>
          <div className="hero-stat">
            <strong>Smart Save+</strong>
            <span>Value protection with stable currencies</span>
          </div>
        </div>

        <div className="hero-preview">
          <div className="hero-preview__card">
            <span>Cloud sync</span>
            <strong>Private account storage</strong>
          </div>
          <div className="hero-preview__card hero-preview__card--accent">
            <span>First import</span>
            <strong>Starts empty until you add data</strong>
          </div>
        </div>
      </Panel>

      <Panel title={mode === "login" ? "Login / Sign Up" : "Create your account"} subtitle="Enter the student finance cockpit" className="auth-form-panel">
        <div className="section-header">
          <div className="mode-switch">
            <button className={`chip ${mode === "login" ? "chip--active" : ""}`} type="button" onClick={() => onModeChange("login")}>
              Login
            </button>
            <button className={`chip ${mode === "signup" ? "chip--active" : ""}`} type="button" onClick={() => onModeChange("signup")}>
              Sign Up
            </button>
          </div>
        </div>

        <form className="stack" onSubmit={onSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="student@school.edu"
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="Your secure password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>

          {mode === "signup" ? (
            <label className="field">
              <span>Country</span>
              <select className="input" value={countryCode} onChange={(event) => onCountryChange(event.target.value)}>
                {countryOptions.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="button-row">
            <button className="button button--primary" type="submit" disabled={isAuthenticating}>
              {isAuthenticating ? (
                <span>{mode === "login" ? "Signing in..." : "Creating account..."}</span>
              ) : mode === "login" ? (
                <>
                  <CheckCircle2 size={16} />
                  Login
                </>
              ) : (
                <>
                  <BadgeDollarSign size={16} />
                  Create account
                </>
              )}
            </button>
            <button className="button button--secondary" type="button" onClick={onTryDemo} disabled={isAuthenticating}>
              <Sparkles size={16} />
              Try Demo
            </button>
          </div>
        </form>

        <div className="auth-note">
          <ShieldCheck size={16} />
          {cloudReady
            ? "Your account and transactions sync to Supabase after login. Android SMS import stays local until the parsed transaction is saved."
            : "Configure Supabase to enable real login and cloud sync. Demo mode still works for previews."}
        </div>

        {mode === "signup" && cloudReady ? (
          <div className="auth-note auth-note--signup">
            <ShieldCheck size={16} />
            <span>
              SmartBudget will use <strong>{countryOptions.find((country) => country.code === countryCode)?.currency ?? "your local currency"}</strong>{" "}
              for dashboard and ledger display after signup. <br />
              After you sign up, check your email for the confirmation link and open it from{" "}
              <strong>{redirectHost ?? "the same SmartBudget site"}</strong> to return to SmartBudget.
            </span>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}

export function PermissionScreen({
  onAllowSmsAccess,
  onUseDemoData,
  allowDemoData,
  isAndroidNative,
  isImportingNativeSms,
}: {
  onAllowSmsAccess: () => void;
  onUseDemoData: () => void;
  allowDemoData: boolean;
  isAndroidNative: boolean;
  isImportingNativeSms: boolean;
}) {
  return (
    <div className="permission-layout">
      <Panel title="SMS permission" subtitle="Connect your financial data securely" className="permission-panel">
        <p className="lede">
          {isAndroidNative
            ? "Grant SmartBudget access to existing and incoming SMS on this Android device. Matching bank or card alerts are checked automatically, and real debit or credit activity is added to your ledger."
            : "SmartBudget reads bank SMS messages with your permission, extracts the merchant and amount, then auto-categorizes the transaction for the dashboard."}
        </p>

        <div className="permission-actions">
          <button className="button button--primary" type="button" onClick={onAllowSmsAccess} disabled={isImportingNativeSms}>
            {isAndroidNative ? <ScanText size={16} /> : <CheckCircle2 size={16} />}
            {isImportingNativeSms ? "Enabling..." : isAndroidNative ? "Enable SMS Auto Sync" : "Allow SMS Access"}
          </button>
          {allowDemoData ? (
            <button className="button button--secondary" type="button" onClick={onUseDemoData} disabled={isImportingNativeSms}>
              <ScanText size={16} />
              Use demo SMS
            </button>
          ) : null}
        </div>

        <div className="privacy-card">
          <strong>Your data stays private</strong>
          <p>
            {isAndroidNative
              ? "On Android, SmartBudget can read existing and incoming SMS after permission is granted. Only messages that look financial are classified, and only transaction data is saved to your account."
              : "SMS content is used only for local analysis and optional AI categorization."}
          </p>
        </div>
      </Panel>

      <Panel title="What happens next" subtitle="Your account starts empty. Only real imports create ledger entries." className="sms-preview-panel">
        <div className="phone-mockup">
          <div className="phone-mockup__top" />
          <div className="phone-mockup__screen">
            <div className="phone-message phone-message--system">
              <strong>SmartBudget</strong>
              <p>Grant SMS access to let SmartBudget monitor bank alerts on this device and update the ledger automatically.</p>
            </div>
            <div className="phone-message">
              <ScanText size={15} />
              <p>Existing inbox messages are scanned once, then each new bank SMS is checked as it arrives for debit or credit activity.</p>
            </div>
            <div className="phone-message">
              <ShieldCheck size={15} />
              <p>Only confirmed transaction details are saved to your ledger. Cash spending can still be added manually later.</p>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function getRedirectHost(authRedirectUrl?: string) {
  if (!authRedirectUrl) {
    return null;
  }

  try {
    return new URL(authRedirectUrl).host;
  } catch {
    return authRedirectUrl.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  }
}
