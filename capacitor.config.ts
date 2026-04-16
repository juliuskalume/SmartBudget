import "dotenv/config";
import type { CapacitorConfig } from "@capacitor/cli";

const DEFAULT_APP_URL = "https://hamid-smart-budget.vercel.app";
const rawAppUrl = (process.env.APP_URL ?? DEFAULT_APP_URL).trim();
const appUrl =
  rawAppUrl && /^https?:\/\//i.test(rawAppUrl) && rawAppUrl !== "MY_APP_URL"
    ? rawAppUrl.replace(/\/+$/, "")
    : undefined;

const config: CapacitorConfig = {
  appId: "com.smartbudget.app",
  appName: "SmartBudget",
  webDir: "dist",
  server: {
    androidScheme: "https",
    ...(appUrl
      ? {
          url: appUrl,
          cleartext: appUrl.startsWith("http://"),
          allowNavigation: [new URL(appUrl).hostname],
        }
      : {}),
  },
};

export default config;
