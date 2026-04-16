package com.smartbudget.app.plugins;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public final class SmartBudgetSmsStore {

    private static final String PREFS_NAME = "smartbudget_sms_store";
    private static final String QUEUE_KEY = "pending_messages";
    private static final int MAX_QUEUE_SIZE = 120;

    private SmartBudgetSmsStore() {}

    public static synchronized void queueMessage(Context context, String id, String address, String body, long date, boolean read) {
        if (context == null || body == null || body.trim().isEmpty()) {
            return;
        }

        JSONArray queue = readQueue(context);

        if (containsMessage(queue, id, body, date)) {
            return;
        }

        JSONObject entry = new JSONObject();
        try {
            entry.put("id", id);
            entry.put("address", address == null ? "" : address);
            entry.put("body", body.trim());
            entry.put("date", date);
            entry.put("read", read);
            queue.put(entry);
        } catch (JSONException ignored) {
            return;
        }

        trimQueue(queue);
        writeQueue(context, queue);
    }

    public static synchronized JSArray consumeMessages(Context context) {
        JSONArray queue = readQueue(context);
        writeQueue(context, new JSONArray());
        return toJSArray(queue);
    }

    private static boolean containsMessage(JSONArray queue, String id, String body, long date) {
        for (int index = 0; index < queue.length(); index++) {
            JSONObject item = queue.optJSONObject(index);
            if (item == null) {
                continue;
            }

            String existingId = item.optString("id", "");
            String existingBody = item.optString("body", "");
            long existingDate = item.optLong("date", -1L);
            if ((id != null && id.equals(existingId)) || (body.trim().equals(existingBody.trim()) && date == existingDate)) {
                return true;
            }
        }

        return false;
    }

    private static void trimQueue(JSONArray queue) {
        while (queue.length() > MAX_QUEUE_SIZE) {
            JSONArray trimmed = new JSONArray();
            for (int index = 1; index < queue.length(); index++) {
                trimmed.put(queue.opt(index));
            }
            queue = copyInto(queue, trimmed);
        }
    }

    private static JSONArray copyInto(JSONArray target, JSONArray source) {
        while (target.length() > 0) {
            target.remove(0);
        }
        for (int index = 0; index < source.length(); index++) {
            target.put(source.opt(index));
        }
        return target;
    }

    private static JSONArray readQueue(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String raw = prefs.getString(QUEUE_KEY, "[]");
        try {
            return new JSONArray(raw == null ? "[]" : raw);
        } catch (JSONException ignored) {
            return new JSONArray();
        }
    }

    private static void writeQueue(Context context, JSONArray queue) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(QUEUE_KEY, queue.toString()).apply();
    }

    private static JSArray toJSArray(JSONArray source) {
        JSArray result = new JSArray();

        for (int index = 0; index < source.length(); index++) {
            JSONObject item = source.optJSONObject(index);
            if (item == null) {
                continue;
            }

            JSObject message = new JSObject();
            message.put("id", item.optString("id", ""));
            message.put("address", item.optString("address", ""));
            message.put("body", item.optString("body", ""));
            message.put("date", item.optLong("date", 0L));
            message.put("read", item.optBoolean("read", false));
            result.put(message);
        }

        return result;
    }
}
