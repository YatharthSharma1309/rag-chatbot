/** Human-readable messages for common Supabase Auth errors */
export function formatAuthError(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    if (m.includes("invalid login credentials")) return "Wrong email or password.";
    if (m.includes("email not confirmed"))
      return "Confirm your email first (check inbox), then sign in.";
    if (m.includes("user already registered")) return "That email already has an account — sign in instead.";
    if (m.includes("password")) return err.message;
    return err.message;
  }
  return "Something went wrong. Try again.";
}
