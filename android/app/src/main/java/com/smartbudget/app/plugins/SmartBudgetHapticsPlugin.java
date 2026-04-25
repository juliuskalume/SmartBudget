package com.smartbudget.app.plugins;

import android.content.Context;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.view.HapticFeedbackConstants;
import android.view.View;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SmartBudgetHaptics")
public class SmartBudgetHapticsPlugin extends Plugin {

    @PluginMethod
    public void impact(PluginCall call) {
        if (getActivity() != null) {
            getActivity().runOnUiThread(() -> {
                performImpact(call.getString("style", "selection"));
                call.resolve();
            });
            return;
        }

        performImpact(call.getString("style", "selection"));
        call.resolve();
    }

    private void performImpact(String style) {
        View targetView = getActivity() != null ? getActivity().getCurrentFocus() : null;
        if (targetView == null && getBridge() != null) {
            targetView = getBridge().getWebView();
        }

        boolean didPerformViewFeedback = false;
        if (targetView != null) {
            targetView.setHapticFeedbackEnabled(true);
            didPerformViewFeedback = targetView.performHapticFeedback(
                resolveFeedbackConstant(style),
                HapticFeedbackConstants.FLAG_IGNORE_VIEW_SETTING
            );
        }

        if (!didPerformViewFeedback) {
            vibrateFallback(style);
        }
    }

    private void vibrateFallback(String style) {
        Vibrator vibrator = resolveVibrator();
        if (vibrator == null || !vibrator.hasVibrator()) {
            return;
        }

        long duration = resolveVibrationDuration(style);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(duration, resolveAmplitude(style)));
            return;
        }

        vibrator.vibrate(duration);
    }

    private Vibrator resolveVibrator() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            VibratorManager vibratorManager = (VibratorManager) getContext().getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            return vibratorManager != null ? vibratorManager.getDefaultVibrator() : null;
        }

        return (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
    }

    private int resolveFeedbackConstant(String style) {
        if ("heavy".equals(style)) {
            return HapticFeedbackConstants.LONG_PRESS;
        }

        if ("medium".equals(style)) {
            return HapticFeedbackConstants.VIRTUAL_KEY;
        }

        if ("light".equals(style)) {
            return HapticFeedbackConstants.KEYBOARD_TAP;
        }

        return HapticFeedbackConstants.KEYBOARD_TAP;
    }

    private long resolveVibrationDuration(String style) {
        if ("heavy".equals(style)) {
            return 28L;
        }

        if ("medium".equals(style)) {
            return 20L;
        }

        if ("light".equals(style)) {
            return 12L;
        }

        return 16L;
    }

    private int resolveAmplitude(String style) {
        if ("heavy".equals(style)) {
            return 220;
        }

        if ("medium".equals(style)) {
            return 160;
        }

        if ("light".equals(style)) {
            return 90;
        }

        return 120;
    }
}
