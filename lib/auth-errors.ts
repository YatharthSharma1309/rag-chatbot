import {
  isAuthError,
  isAuthPKCECodeVerifierMissingError,
  isAuthWeakPasswordError,
} from "@supabase/auth-js";

/** Maps GoTrue `error` codes (see @supabase/auth-js ErrorCode) to user-facing copy */
const CODE_MESSAGES: Record<string, string> = {
  invalid_credentials: "Wrong email or password.",
  email_not_confirmed:
    "Confirm your email first (check inbox), then sign in.",
  user_already_exists: "That email already has an account — sign in instead.",
  email_exists: "That email already has an account — sign in instead.",
  signup_disabled: "New accounts are not allowed on this project.",
  weak_password: "Choose a stronger password.",
  over_email_send_rate_limit:
    "Too many emails sent. Wait a few minutes and try again.",
  over_request_rate_limit:
    "Too many attempts. Wait a moment and try again.",
  over_sms_send_rate_limit:
    "Too many SMS messages sent. Wait and try again.",
  provider_disabled: "That sign-in method is disabled.",
  oauth_provider_not_supported: "That sign-in provider is not supported.",
  bad_oauth_state:
    "Sign-in expired or opened in another tab. Close extra tabs and try again.",
  bad_oauth_callback: "Could not finish sign-in. Try again.",
  captcha_failed: "Verification failed. Refresh the page and try again.",
  session_expired: "Your session expired. Sign in again.",
  user_not_found: "No account found with that email.",
  bad_jwt: "Your session is invalid. Sign out and sign in again.",
  email_address_invalid: "That email address is not valid.",
  email_address_not_authorized: "That email is not allowed to sign up.",
  request_timeout: "The server took too long to respond. Try again.",
};

function weakPasswordHint(reasons: readonly string[]): string {
  const parts: string[] = [];
  for (const r of reasons) {
    if (r === "length") parts.push("use a longer password");
    else if (r === "characters")
      parts.push("mix letters, numbers, and symbols");
    else if (r === "pwned") parts.push("avoid commonly breached passwords");
    else parts.push(r.replace(/_/g, " "));
  }
  const hint = parts.length ? ` (${parts.join("; ")})` : "";
  return `Password does not meet security rules${hint}.`;
}

/** Fallback when the API returns legacy / localized messages without a known code */
function mapLegacyMessage(lower: string): string | undefined {
  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials")
  )
    return "Wrong email or password.";
  if (lower.includes("email not confirmed"))
    return "Confirm your email first (check inbox), then sign in.";
  if (
    lower.includes("user already registered") ||
    lower.includes("already registered") ||
    lower.includes("already been registered") ||
    lower.includes("user already exists")
  )
    return "That email already has an account — sign in instead.";
  if (lower.includes("signup_disabled") || lower.includes("signup disabled"))
    return CODE_MESSAGES.signup_disabled;
  return undefined;
}

export function formatAuthError(err: unknown): string {
  if (isAuthWeakPasswordError(err)) {
    return weakPasswordHint(err.reasons ?? []);
  }

  if (isAuthPKCECodeVerifierMissingError(err)) {
    return "Sign-in was interrupted (different browser or cleared storage). Try again from this tab.";
  }

  if (isAuthError(err)) {
    const code = typeof err.code === "string" ? err.code : undefined;
    if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];

    const msg = err.message?.trim() ?? "";
    const legacy = msg ? mapLegacyMessage(msg.toLowerCase()) : undefined;
    if (legacy) return legacy;

    if (msg) return msg;
    return "Something went wrong. Try again.";
  }

  if (err instanceof Error) {
    const msg = err.message.trim();
    if (
      msg.includes("NEXT_PUBLIC_SUPABASE_URL") ||
      msg.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    ) {
      return "App misconfiguration: Supabase URL or anon key is missing.";
    }
    const legacy = mapLegacyMessage(msg.toLowerCase());
    if (legacy) return legacy;
    if (msg) return msg;
  }

  return "Something went wrong. Try again.";
}
