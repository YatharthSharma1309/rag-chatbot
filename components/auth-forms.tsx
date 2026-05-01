"use client";

import { FormEvent, useState } from "react";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AuthForms() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createBrowserSupabaseClient();
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        setMessage(
          "Account created. If email confirmation is enabled in Supabase, check your inbox — then sign in.",
        );
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
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
          }}
        >
          <UserPlus className="h-3.5 w-3.5" aria-hidden />
          Register
        </button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
        <div>
          <label htmlFor="auth-password" className="text-xs font-medium text-muted-foreground">
            Password
          </label>
          <Input
            id="auth-password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 h-10 border-border/80 bg-background/80"
            placeholder="Min. 6 characters"
          />
        </div>

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

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Uploads and AI features require an account. Keys are encrypted on the server — see AI settings after login.
      </p>
    </div>
  );
}
