import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { safeInternalPath } from "@/lib/auth-redirect";

/**
 * OAuth (Google) and email flows (signup confirm / password recovery) arrive here with ?code=...
 *
 * IMPORTANT (Next.js App Router): session cookies MUST be applied to the same NextResponse we return.
 * Using cookies() from next/headers + a separate NextResponse.redirect() drops Set-Cookie headers,
 * so login/Google appears to "fail" after redirect.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = safeInternalPath(url.searchParams.get("next"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const failRedirect = NextResponse.redirect(new URL("/?auth_error=1", url.origin));

  if (!supabaseUrl || !supabaseAnon) {
    console.error("[auth/callback] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return failRedirect;
  }

  if (!code) {
    return failRedirect;
  }

  const redirectTarget = new URL(nextPath, url.origin);
  const response = NextResponse.redirect(redirectTarget);

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback]", error.message);
    return failRedirect;
  }

  return response;
}
