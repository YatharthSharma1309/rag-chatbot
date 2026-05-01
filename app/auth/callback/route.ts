import { NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { safeInternalPath } from "@/lib/auth-redirect";

/**
 * OAuth (Google) and password-recovery redirects land here with ?code=...
 * Exchanges the code for a session cookie, then redirects to `next` (internal path only).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeInternalPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=1`);
  }

  try {
    const supabase = createRouteHandlerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback]", error.message);
      return NextResponse.redirect(`${origin}/?auth_error=1`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  } catch (err) {
    console.error("[auth/callback]", err);
    return NextResponse.redirect(`${origin}/?auth_error=1`);
  }
}
