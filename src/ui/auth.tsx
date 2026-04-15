import type { FormEvent } from "react";
import {
  BadgeDollarSign,
  CheckCircle2,
  PiggyBank,
  ScanText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Panel } from "./shared";

export function AuthScreen({
  mode,
  email,
  password,
  onModeChange,
  onEmailChange,
  onPasswordChange,
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
          <PiggyBank size={16} />
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
            <span>Financial health</span>
            <strong>78 / 100</strong>
          </div>
          <div className="hero-preview__card hero-preview__card--accent">
            <span>Latest import</span>
            <strong>Migros - 150 TL</strong>
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
  sampleSms,
  onAllowSmsAccess,
  onUseDemoData,
  isAndroidNative,
  isImportingNativeSms,
}: {
  sampleSms: string[];
  onAllowSmsAccess: () => void;
  onUseDemoData: () => void;
  isAndroidNative: boolean;
  isImportingNativeSms: boolean;
}) {
  return (
    <div className="permission-layout">
      <Panel title="SMS permission" subtitle="Connect your financial data securely" className="permission-panel">
        <p className="lede">
          {isAndroidNative
            ? "SmartBudget reads bank SMS messages from your phone with your permission, extracts the merchant and amount, then turns the message into a saved transaction."
            : "SmartBudget reads bank SMS messages with your permission, extracts the merchant and amount, then auto-categorizes the transaction for the dashboard."}
        </p>

        <div className="permission-actions">
          <button className="button button--primary" type="button" onClick={onAllowSmsAccess} disabled={isImportingNativeSms}>
            {isAndroidNative ? <ScanText size={16} /> : <CheckCircle2 size={16} />}
            {isImportingNativeSms ? "Importing..." : isAndroidNative ? "Import from phone" : "Allow SMS Access"}
          </button>
          <button className="button button--secondary" type="button" onClick={onUseDemoData} disabled={isImportingNativeSms}>
            <ScanText size={16} />
            Use demo SMS
          </button>
        </div>

        <div className="privacy-card">
          <strong>Your data stays private</strong>
          <p>
            {isAndroidNative
              ? "On Android, SMS content is read locally after permission is granted. Only the parsed transaction details are saved to your account."
              : "SMS content is used only for local analysis and optional AI categorization."}
          </p>
        </div>
      </Panel>

      <Panel title="Message preview" subtitle="Sample bank alerts that the parser can understand." className="sms-preview-panel">
        <div className="phone-mockup">
          <div className="phone-mockup__top" />
          <div className="phone-mockup__screen">
            <div className="phone-message phone-message--system">
              <strong>SmartBudget</strong>
              <p>To track expenses automatically, we need SMS permission.</p>
            </div>
            {sampleSms.map((message) => (
              <div className="phone-message" key={message}>
                <ScanText size={15} />
                <p>{message}</p>
              </div>
            ))}
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
