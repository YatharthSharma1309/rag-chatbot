"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  createBrowserSupabaseClient,
  isBrowserSupabaseConfigured,
} from "@/lib/supabase/browser";

export function useAuth() {
  const supabase = useMemo(() => {
    if (typeof window === "undefined") return null;
    if (!isBrowserSupabaseConfigured()) return null;
    return createBrowserSupabaseClient();
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!cancelled) setUser(session?.user ?? null);
    });

    /** Fail open to signed-out UI if Auth hangs (offline, flaky proxy, blocked third-party). */
    const sessionProbeMs = 8_000;

    void (async () => {
      try {
        const timeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("auth_probe_timeout")), sessionProbeMs);
        });
        const { data } = await Promise.race([supabase.auth.getSession(), timeout]);
        if (!cancelled) setUser(data.session?.user ?? null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  return { user, loading, signOut, supabase };
}
