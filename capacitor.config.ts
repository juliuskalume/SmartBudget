import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.smartbudget.app",
  appName: "SmartBudget",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
