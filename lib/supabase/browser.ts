import { createBrowserClient } from "@supabase/ssr";

/** True when client-side Supabase auth can run (both vars non-empty after trim). */
export function isBrowserSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return !!(url && anon);
}

/**
 * Browser Supabase client for auth (sign-in, sign-up, OAuth, password flows).
 * Uses `@supabase/ssr` cookie storage (`document.cookie`, chunked) + PKCE so the same
 * session is visible to middleware (`middleware.ts`) and route handlers
 * (`createRouteHandlerSupabaseClient`) without separate localStorage auth state.
 */
export function createBrowserSupabaseClient() {
  if (!isBrowserSupabaseConfigured()) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();
  return createBrowserClient(url, anon);
}
