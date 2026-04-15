package com.smartbudget.app.plugins;

import android.Manifest;
import android.database.Cursor;
import android.provider.Telephony;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

@CapacitorPlugin(
    name = "SmartBudgetSms",
    permissions = {
        @Permission(strings = { Manifest.permission.READ_SMS }, alias = "sms")
    }
)
public class SmartBudgetSmsPlugin extends Plugin {

    private static final String PERMISSION_ALIAS = "sms";
    private static final Pattern CURRENCY_PATTERN = Pattern.compile(".*(\\d[\\d.,]*)\\s*(tl|try|usd|eur|\\$|\\u20ba|\\u20ac).*");

    @PluginMethod
    public void importInbox(PluginCall call) {
        if (getPermissionState(PERMISSION_ALIAS) == PermissionState.GRANTED) {
            readInbox(call);
            return;
        }

        requestPermissionForAlias(PERMISSION_ALIAS, call, "smsPermissionCallback");
    }

    @PermissionCallback
    private void smsPermissionCallback(PluginCall call) {
        if (getPermissionState(PERMISSION_ALIAS) != PermissionState.GRANTED) {
            call.reject("SMS permission was denied.");
            return;
        }

        readInbox(call);
    }

    private void readInbox(PluginCall call) {
        int requestedLimit = call.getInt("limit", 60);
        int limit = Math.max(1, Math.min(requestedLimit, 200));
        Cursor cursor = null;
        JSArray messages = new JSArray();

        try {
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
                    null,
                    null,
                    Telephony.Sms.DATE + " DESC"
                );

            if (cursor != null) {
                int idColumn = cursor.getColumnIndexOrThrow(Telephony.Sms._ID);
                int addressColumn = cursor.getColumnIndex(Telephony.Sms.ADDRESS);
                int bodyColumn = cursor.getColumnIndexOrThrow(Telephony.Sms.BODY);
                int dateColumn = cursor.getColumnIndexOrThrow(Telephony.Sms.DATE);
                int readColumn = cursor.getColumnIndex(Telephony.Sms.READ);
                int count = 0;

                while (cursor.moveToNext() && count < limit) {
                    String body = cursor.getString(bodyColumn);
                    if (!isLikelyFinancialSms(body)) {
                        continue;
                    }

                    JSObject sms = new JSObject();
                    sms.put("id", String.valueOf(cursor.getLong(idColumn)));
                    sms.put("address", addressColumn >= 0 ? cursor.getString(addressColumn) : "");
                    sms.put("body", body == null ? "" : body);
                    sms.put("date", cursor.getLong(dateColumn));
                    sms.put("read", readColumn >= 0 && cursor.getInt(readColumn) == 1);
                    messages.put(sms);
                    count++;
                }
            }

            JSObject result = new JSObject();
            result.put("messages", messages);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Unable to read SMS inbox.", e);
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }
    }

    private boolean isLikelyFinancialSms(String body) {
        if (body == null || body.trim().isEmpty()) {
            return false;
        }

        String text = normalizeText(body);
        if (CURRENCY_PATTERN.matcher(text).matches()) {
            return true;
        }

        String[] cues = new String[] {
            "harcama",
            "odeme",
            "payment",
            "debit",
            "credit",
            "transfer",
            "yatir",
            "bakiye",
            "spent",
            "purchase",
            "refund",
            "iade",
            "invoice",
            "fatura",
            "bill",
        };

        for (String cue : cues) {
            if (text.contains(cue)) {
                return true;
            }
        }

        return false;
    }

    private String normalizeText(String input) {
        return Normalizer.normalize(input.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
            .replaceAll("\\p{M}+", "")
            .replaceAll("\\s+", " ")
            .trim();
    }
}
