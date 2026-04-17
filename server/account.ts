import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const adminSupabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

export async function deleteAuthenticatedAccount(accessToken: string) {
  const token = accessToken.replace(/^Bearer\s+/i, "").trim();

  if (!adminSupabase) {
    throw new Error("Account deletion is not configured on the server.");
  }

  if (!token) {
    throw new Error("Missing access token.");
  }

  const {
    data: { user },
    error: userError,
  } = await adminSupabase.auth.getUser(token);

  if (userError || !user) {
    throw new Error("Unauthorized account deletion request.");
  }

  const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(user.id);
  if (deleteError) {
    throw deleteError;
  }

  return { userId: user.id };
}
