import { useEffect } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";

export type HapticStyle = "selection" | "light" | "medium" | "heavy";

interface SmartBudgetHapticsPlugin {
  impact(options?: { style?: HapticStyle }): Promise<void>;
}

const TOUCH_TARGET_SELECTOR = [
  "button",
  "a[href]",
  "select",
  "summary",
  "[role='button']",
  "input[type='button']",
  "input[type='submit']",
  "input[type='reset']",
  "input[type='checkbox']",
  "input[type='radio']",
  "input[type='range']",
  "[data-haptic]",
].join(", ");

const HAPTIC_COOLDOWN_MS = 40;

const webFallback: SmartBudgetHapticsPlugin = {
  async impact(options) {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
      return;
    }

    if (typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    navigator.vibrate(getVibrationDuration(options?.style));
  },
};

const SmartBudgetHaptics = registerPlugin<SmartBudgetHapticsPlugin>("SmartBudgetHaptics", {
  web: webFallback,
});

export function useTouchHaptics() {
  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") {
      return;
    }

    if (!isTouchHapticsAvailable()) {
      return;
    }

    let lastImpactAt = 0;
    const eventName = "PointerEvent" in window ? "pointerdown" : "touchstart";
    const handleTouch = (event: Event) => {
      if (typeof PointerEvent !== "undefined" && event instanceof PointerEvent) {
        if (event.pointerType === "mouse" || event.isPrimary === false) {
          return;
        }
      }

      const target = resolveTouchTarget(event.target);
      if (!target || isDisabledTarget(target)) {
        return;
      }

      const style = getTargetHapticStyle(target);
      if (!style) {
        return;
      }

      const now = Date.now();
      if (now - lastImpactAt < HAPTIC_COOLDOWN_MS) {
        return;
      }

      lastImpactAt = now;
      void triggerHaptic(style);
    };

    document.addEventListener(eventName, handleTouch, true);

    return () => {
      document.removeEventListener(eventName, handleTouch, true);
    };
  }, []);
}

export async function triggerHaptic(style: HapticStyle = "selection") {
  if (!isTouchHapticsAvailable()) {
    return;
  }

  try {
    await SmartBudgetHaptics.impact({ style });
  } catch {
    // Ignore devices or browsers that do not expose a haptics bridge.
  }
}

function isTouchHapticsAvailable() {
  if (Capacitor.isNativePlatform()) {
    return Capacitor.getPlatform() === "android";
  }

  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

function resolveTouchTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest(TOUCH_TARGET_SELECTOR);
}

function isDisabledTarget(target: Element) {
  const candidate = target as HTMLElement & { disabled?: boolean };
  return candidate.disabled === true || target.getAttribute("aria-disabled") === "true";
}

function getTargetHapticStyle(target: Element): HapticStyle | null {
  const override = target.closest("[data-haptic]")?.getAttribute("data-haptic");
  if (override === "off") {
    return null;
  }

  if (override === "light" || override === "medium" || override === "heavy" || override === "selection") {
    return override;
  }

  if (target instanceof HTMLInputElement && target.type === "range") {
    return "light";
  }

  return "selection";
}

function getVibrationDuration(style: HapticStyle = "selection") {
  switch (style) {
    case "light":
      return 10;
    case "medium":
      return 16;
    case "heavy":
      return 24;
    case "selection":
    default:
      return 12;
  }
}
