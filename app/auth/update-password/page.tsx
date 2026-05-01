"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { createBrowserSupabaseClient, isBrowserSupabaseConfigured } from "@/lib/supabase/browser";
import { SupabaseEnvMissingCard } from "@/components/supabase-env-missing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const configured = isBrowserSupabaseConfigured();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!session) {
          router.replace("/?expired_reset=1");
          return;
        }
        setReady(true);
      } catch {
        if (!cancelled) router.replace("/?expired_reset=1");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, configured]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (password.length < 6) {
      setMsg("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setMsg("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.replace("/");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <main className="container max-w-md py-16">
        <SupabaseEnvMissingCard />
      </main>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm">Checking your reset session…</p>
      </div>
    );
  }

  return (
    <main className="container max-w-md py-16">
      <div className="rounded-xl border border-border/80 bg-card/90 p-6 shadow-xl ring-1 ring-white/[0.04]">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Lock className="h-4 w-4 text-primary" aria-hidden />
          Set a new password
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Choose a new password for your account. After saving you&apos;ll return to the app.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="npw" className="text-xs font-medium text-muted-foreground">
              New password
            </label>
            <Input
              id="npw"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 h-10 border-border/80 bg-background/80"
            />
          </div>
          <div>
            <label htmlFor="npw2" className="text-xs font-medium text-muted-foreground">
              Confirm password
            </label>
            <Input
              id="npw2"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1.5 h-10 border-border/80 bg-background/80"
            />
          </div>
          {msg && (
            <p className="rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {msg}
            </p>
          )}
          <Button type="submit" className="h-10 w-full" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Updating…
              </>
            ) : (
              "Save new password"
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link href="/" className="text-primary underline underline-offset-2 hover:opacity-90">
            Cancel and go home
          </Link>
        </p>
      </div>
    </main>
  );
}
