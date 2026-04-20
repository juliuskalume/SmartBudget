package com.smartbudget.app.plugins;

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
        View targetView = getActivity() != null ? getActivity().getCurrentFocus() : null;
        if (targetView == null && getBridge() != null) {
            targetView = getBridge().getWebView();
        }

        if (targetView != null) {
            targetView.performHapticFeedback(resolveFeedbackConstant(call.getString("style", "selection")));
        }

        call.resolve();
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
}
