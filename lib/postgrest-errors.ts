/** PostgREST: relation not in schema cache (table missing or not yet reloaded). */
export function isMissingUserSettingsTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  if (e.code !== "PGRST205") return false;
  const msg = e.message ?? "";
  return typeof msg === "string" && msg.includes("user_settings");
}

export const USER_SETTINGS_SETUP_INSTRUCTIONS =
  "Add DATABASE_URL to .env.local (Supabase → Database → Connection string → URI), run npm run db:setup-user-settings once, then refresh. Or paste supabase/user_settings.sql in the SQL Editor.";
