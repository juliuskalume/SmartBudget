import { Capacitor, registerPlugin } from "@capacitor/core";

export interface AndroidSmsInboxMessage {
  id: string;
  address: string;
  body: string;
  date: number;
  read: boolean;
}

interface SmartBudgetSmsPlugin {
  importInbox(options?: { limit?: number }): Promise<{ messages: AndroidSmsInboxMessage[] }>;
}

const webFallback: SmartBudgetSmsPlugin = {
  async importInbox() {
    throw new Error("SmartBudgetSms is only available on Android.");
  },
};

const SmartBudgetSms = registerPlugin<SmartBudgetSmsPlugin>("SmartBudgetSms", {
  web: webFallback,
});

export function isAndroidNativePlatform() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export async function importAndroidSmsMessages(limit = 60) {
  if (!isAndroidNativePlatform()) {
    return [];
  }

  const result = await SmartBudgetSms.importInbox({ limit });
  return Array.isArray(result?.messages) ? result.messages : [];
}
