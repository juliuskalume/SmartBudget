import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export interface AndroidSmsInboxMessage {
  id: string;
  address: string;
  body: string;
  date: number;
  read: boolean;
}

interface SmartBudgetSmsPlugin {
  importInbox(options?: { limit?: number }): Promise<{ messages: AndroidSmsInboxMessage[] }>;
  consumePending(): Promise<{ messages: AndroidSmsInboxMessage[] }>;
  addListener(
    eventName: "smsReceived",
    listenerFunc: (event: { message: AndroidSmsInboxMessage }) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
}

const webFallback: SmartBudgetSmsPlugin = {
  async importInbox() {
    throw new Error("SmartBudgetSms is only available on Android.");
  },
  async consumePending() {
    return { messages: [] };
  },
  addListener() {
    return Promise.resolve({
      remove: async () => undefined,
    }) as Promise<PluginListenerHandle> & PluginListenerHandle;
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

export async function consumePendingAndroidSmsMessages() {
  if (!isAndroidNativePlatform()) {
    return [];
  }

  const result = await SmartBudgetSms.consumePending();
  return Array.isArray(result?.messages) ? result.messages : [];
}

export function subscribeToAndroidSmsMessages(listener: (message: AndroidSmsInboxMessage) => void) {
  if (!isAndroidNativePlatform()) {
    return null;
  }

  return SmartBudgetSms.addListener("smsReceived", (event) => {
    if (event?.message) {
      listener(event.message);
    }
  });
}
