package com.smartbudget.app.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import com.getcapacitor.JSObject;
import com.smartbudget.app.plugins.SmartBudgetSmsStore;
import com.smartbudget.app.plugins.SmartBudgetSmsUtils;

public class SmartBudgetSmsReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        JSObject message = SmartBudgetSmsUtils.extractMessage(intent);
        if (message == null) {
            return;
        }

        SmartBudgetSmsStore.queueMessage(
            context,
            message.optString("id", ""),
            message.optString("address", ""),
            message.optString("body", ""),
            message.optLong("date", System.currentTimeMillis()),
            message.optBoolean("read", false)
        );
    }
}
