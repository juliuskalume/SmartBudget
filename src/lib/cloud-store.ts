import { supabase } from "./supabase";
import { normalizeCloudState, type CloudState } from "./app-state";

const TABLE_NAME = "user_app_state";

export async function loadCloudState(userId: string): Promise<CloudState | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from(TABLE_NAME).select("payload").eq("user_id", userId).maybeSingle();
  if (error) {
    throw error;
  }

  if (!data || !("payload" in data) || !data.payload) {
    return null;
  }

  return normalizeCloudState(data.payload);
}

export async function saveCloudState(userId: string, state: CloudState): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from(TABLE_NAME).upsert({
    user_id: userId,
    payload: state,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}
