"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { formatAuthError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AuthForms() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const authCallback = `${origin}/auth/callback?next=/`;

      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: authCallback,
          },
        });
        if (error) throw error;

        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setMessage("That email is already registered — switch to Sign in.");
          setMode("login");
          setBusy(false);
          return;
        }

        if (data.session) {
          router.refresh();
          setPassword("");
          setMessage(null);
          setBusy(false);
          return;
        }

        setMessage(
          "Check your email to confirm your account (Supabase sends a link). Then sign in here.",
        );
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        router.refresh();
        setPassword("");
      }
    } catch (err) {
      setMessage(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleResetLink(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setMessage("Enter your email above first.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (error) throw error;
      setMessage("Check your email for a reset link (valid for a limited time).");
      setForgotOpen(false);
    } catch (err) {
      setMessage(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      throw new Error("Google sign-in did not return a redirect URL — enable Google in Supabase Auth.");
    } catch (err) {
      setMessage(formatAuthError(err));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border/80 bg-card/90 p-6 shadow-xl ring-1 ring-white/[0.04] backdrop-blur-sm">
      <div className="flex rounded-lg bg-muted/40 p-1">
        <button
          type="button"
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-xs font-medium transition-colors",
            mode === "login" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground",
          )}
          onClick={() => {
            setMode("login");
            setMessage(null);
            setForgotOpen(false);
          }}
        >
          <LogIn className="h-3.5 w-3.5" aria-hidden />
          Sign in
        </button>
        <button
          type="button"
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-xs font-medium transition-colors",
            mode === "register" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground",
          )}
          onClick={() => {
            setMode("register");
            setMessage(null);
            setForgotOpen(false);
          }}
        >
          <UserPlus className="h-3.5 w-3.5" aria-hidden />
          Register
        </button>
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-5 h-10 w-full gap-2 border-border/80 bg-background/60 text-xs font-medium"
        disabled={busy}
        onClick={() => void handleGoogle()}
      >
        <svg className="h-4 w-4" aria-hidden viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">or email</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {!forgotOpen ? (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="auth-email" className="text-xs font-medium text-muted-foreground">
              Email
            </label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-10 border-border/80 bg-background/80"
              placeholder="you@example.com"
            />
          </div>
          {mode === "login" ? (
            <div>
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="auth-password" className="text-xs font-medium text-muted-foreground">
                  Password
                </label>
                <button
                  type="button"
                  className="text-[11px] text-primary underline-offset-2 hover:underline"
                  onClick={() => {
                    setForgotOpen(true);
                    setMessage(null);
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="auth-password"
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 h-10 border-border/80 bg-background/80"
                placeholder="Min. 6 characters"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="auth-password" className="text-xs font-medium text-muted-foreground">
                Password
              </label>
              <Input
                id="auth-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 h-10 border-border/80 bg-background/80"
                placeholder="Min. 6 characters"
              />
            </div>
          )}

          {message && (
            <p className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              {message}
            </p>
          )}

          <Button type="submit" className="h-10 w-full" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Please wait…
              </>
            ) : mode === "login" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleResetLink}>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Enter the email for your account. We&apos;ll send a link to set a new password.
          </p>
          <div>
            <label htmlFor="reset-email" className="text-xs font-medium text-muted-foreground">
              Email
            </label>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-10 border-border/80 bg-background/80"
              placeholder="you@example.com"
            />
          </div>
          {message && (
            <p className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              {message}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="h-10 flex-1" disabled={busy} onClick={() => setForgotOpen(false)}>
              Back
            </Button>
            <Button type="submit" className="h-10 flex-1" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Send reset link"}
            </Button>
          </div>
        </form>
      )}

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Uploads and AI features require an account. Keys are encrypted on the server — see AI settings after login.
      </p>
    </div>
  );
}
