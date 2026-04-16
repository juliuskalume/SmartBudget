package com.smartbudget.app.plugins;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import com.getcapacitor.JSObject;
import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public final class SmartBudgetSmsUtils {

    private static final Pattern CURRENCY_PATTERN = Pattern.compile(".*(\\d[\\d.,]*)\\s*(tl|try|usd|eur|\\$|\\u20ba|\\u20ac).*");

    private SmartBudgetSmsUtils() {}

    public static JSObject extractMessage(Intent intent) {
        if (intent == null || !Telephony.Sms.Intents.SMS_RECEIVED_ACTION.equals(intent.getAction())) {
            return null;
        }

        Bundle extras = intent.getExtras();
        if (extras == null) {
            return null;
        }

        Object[] pdus = (Object[]) extras.get("pdus");
        if (pdus == null || pdus.length == 0) {
            return null;
        }

        String format = extras.getString("format");
        StringBuilder bodyBuilder = new StringBuilder();
        String address = "";
        long timestamp = System.currentTimeMillis();

        for (Object pdu : pdus) {
            if (!(pdu instanceof byte[])) {
                continue;
            }

            SmsMessage message = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? SmsMessage.createFromPdu((byte[]) pdu, format)
                : SmsMessage.createFromPdu((byte[]) pdu);

            if (message == null) {
                continue;
            }

            bodyBuilder.append(message.getMessageBody());
            if (address.isEmpty()) {
                address = message.getDisplayOriginatingAddress();
            }
            timestamp = Math.max(timestamp, message.getTimestampMillis());
        }

        String body = bodyBuilder.toString().trim();
        if (body.isEmpty() || !isLikelyFinancialSms(body)) {
            return null;
        }

        JSObject sms = new JSObject();
        sms.put("id", buildMessageId(address, body, timestamp));
        sms.put("address", address == null ? "" : address);
        sms.put("body", body);
        sms.put("date", timestamp);
        sms.put("read", false);
        return sms;
    }

    public static boolean isLikelyFinancialSms(String body) {
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
            "hesab",
            "kart",
        };

        for (String cue : cues) {
            if (text.contains(cue)) {
                return true;
            }
        }

        return false;
    }

    private static String normalizeText(String input) {
        return Normalizer.normalize(input.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
            .replaceAll("\\p{M}+", "")
            .replaceAll("\\s+", " ")
            .trim();
    }

    private static String buildMessageId(String address, String body, long timestamp) {
        int addressHash = address == null ? 0 : address.hashCode();
        int bodyHash = body == null ? 0 : body.hashCode();
        return "incoming-" + timestamp + "-" + Math.abs(addressHash ^ bodyHash);
    }
}
