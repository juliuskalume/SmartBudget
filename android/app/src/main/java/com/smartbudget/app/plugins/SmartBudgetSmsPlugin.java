package com.smartbudget.app.plugins;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.provider.Telephony;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "SmartBudgetSms",
    permissions = {
        @Permission(strings = { Manifest.permission.READ_SMS, Manifest.permission.RECEIVE_SMS }, alias = "sms")
    }
)
public class SmartBudgetSmsPlugin extends Plugin {

    private static final String PERMISSION_ALIAS = "sms";
    private BroadcastReceiver liveReceiver;

    @Override
    public void load() {
        super.load();
        registerLiveReceiver();
    }

    @Override
    protected void handleOnDestroy() {
        unregisterLiveReceiver();
        super.handleOnDestroy();
    }

    @PluginMethod
    public void importInbox(PluginCall call) {
        if (getPermissionState(PERMISSION_ALIAS) == PermissionState.GRANTED) {
            readInbox(call);
            return;
        }

        requestPermissionForAlias(PERMISSION_ALIAS, call, "smsPermissionCallback");
    }

    @PluginMethod
    public void consumePending(PluginCall call) {
        JSArray messages = SmartBudgetSmsStore.consumeMessages(getContext());
        JSObject result = new JSObject();
        result.put("messages", messages);
        call.resolve(result);
    }

    @PermissionCallback
    private void smsPermissionCallback(PluginCall call) {
        if (getPermissionState(PERMISSION_ALIAS) != PermissionState.GRANTED) {
            call.reject("SMS permission was denied.");
            return;
        }

        registerLiveReceiver();
        readInbox(call);
    }

    private void readInbox(PluginCall call) {
        int requestedLimit = call.getInt("limit", 60);
        int limit = Math.max(1, Math.min(requestedLimit, 200));
        Long requestedAfterDate = call.getLong("afterDate");
        long afterDate = requestedAfterDate == null ? 0L : Math.max(0L, requestedAfterDate);
        boolean incremental = afterDate > 0L;
        Cursor cursor = null;
        JSArray messages = new JSArray();
        long scannedThroughDate = afterDate;

        try {
            String selection = incremental ? Telephony.Sms.DATE + " > ?" : null;
            String[] selectionArgs = incremental ? new String[] { String.valueOf(afterDate) } : null;
            String sortOrder = incremental
                ? Telephony.Sms.DATE + " ASC"
                : Telephony.Sms.DATE + " DESC";

            cursor = getContext()
                .getContentResolver()
                .query(
                    Telephony.Sms.Inbox.CONTENT_URI,
                    new String[] {
                        Telephony.Sms._ID,
                        Telephony.Sms.ADDRESS,
                        Telephony.Sms.BODY,
                        Telephony.Sms.DATE,
                        Telephony.Sms.READ
                    },
                    selection,
                    selectionArgs,
                    sortOrder
                );

            if (cursor != null) {
                int idColumn = cursor.getColumnIndexOrThrow(Telephony.Sms._ID);
                int addressColumn = cursor.getColumnIndex(Telephony.Sms.ADDRESS);
                int bodyColumn = cursor.getColumnIndexOrThrow(Telephony.Sms.BODY);
                int dateColumn = cursor.getColumnIndexOrThrow(Telephony.Sms.DATE);
                int readColumn = cursor.getColumnIndex(Telephony.Sms.READ);
                int count = 0;

                while (cursor.moveToNext() && count < limit) {
                    long messageDate = cursor.getLong(dateColumn);
                    scannedThroughDate = Math.max(scannedThroughDate, messageDate);
                    String body = cursor.getString(bodyColumn);
                    if (!SmartBudgetSmsUtils.isLikelyFinancialSms(body)) {
                        continue;
                    }

                    JSObject sms = new JSObject();
                    sms.put("id", String.valueOf(cursor.getLong(idColumn)));
                    sms.put("address", addressColumn >= 0 ? cursor.getString(addressColumn) : "");
                    sms.put("body", body == null ? "" : body);
                    sms.put("date", messageDate);
                    sms.put("read", readColumn >= 0 && cursor.getInt(readColumn) == 1);
                    messages.put(sms);
                    count++;
                }
            }

            JSObject result = new JSObject();
            result.put("messages", messages);
            result.put("incremental", incremental);
            result.put("scannedThroughDate", scannedThroughDate);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Unable to read SMS inbox.", e);
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }
    }

    private void registerLiveReceiver() {
        if (liveReceiver != null) {
            return;
        }

        liveReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(android.content.Context context, Intent intent) {
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
                    false
                );

                JSObject event = new JSObject();
                event.put("message", message);
                notifyListeners("smsReceived", event, true);
            }
        };

        IntentFilter filter = new IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION);
        ContextCompat.registerReceiver(getContext(), liveReceiver, filter, ContextCompat.RECEIVER_EXPORTED);
    }

    private void unregisterLiveReceiver() {
        if (liveReceiver == null) {
            return;
        }

        try {
            getContext().unregisterReceiver(liveReceiver);
        } catch (IllegalArgumentException ignored) {
            // Receiver was not registered or already removed.
        } finally {
            liveReceiver = null;
        }
    }
}
