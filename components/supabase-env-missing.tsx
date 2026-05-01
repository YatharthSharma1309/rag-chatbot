"use client";

import Link from "next/link";

/** Shown when `NEXT_PUBLIC_SUPABASE_*` were not available at build/dev-server start */
export function SupabaseEnvMissingCard() {
  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-amber-500/40 bg-amber-500/[0.08] p-6 shadow-xl ring-1 ring-amber-500/15 backdrop-blur-sm dark:bg-amber-950/25 dark:ring-amber-400/20">
      <p className="text-sm font-semibold text-amber-950 dark:text-amber-50">
        Supabase URL or anon key is not configured
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Next.js only exposes variables that start with{" "}
        <code className="rounded bg-muted/80 px-1 py-0.5 font-mono text-[11px]">NEXT_PUBLIC_</code> to the
        browser. Add them locally and restart the dev server.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-4 text-xs leading-relaxed text-muted-foreground">
        <li>
          Copy{" "}
          <code className="rounded bg-muted/80 px-1 py-0.5 font-mono text-[11px]">.env.example</code> to{" "}
          <code className="rounded bg-muted/80 px-1 py-0.5 font-mono text-[11px]">.env.local</code>.
        </li>
        <li>
          In Supabase →{" "}
          <span className="font-medium text-foreground/90">Project Settings → API</span>, paste{" "}
          <code className="rounded bg-muted/80 px-1 py-0.5 font-mono text-[11px]">
            NEXT_PUBLIC_SUPABASE_URL
          </code>{" "}
          and{" "}
          <code className="rounded bg-muted/80 px-1 py-0.5 font-mono text-[11px]">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>
          .
        </li>
        <li>
          Stop and run <code className="rounded bg-muted/80 px-1 py-0.5 font-mono text-[11px]">npm run dev</code>{" "}
          again so env changes load.
        </li>
      </ol>
      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        <Link href="/" className="text-primary underline underline-offset-2 hover:opacity-90">
          Back to home
        </Link>
      </p>
    </div>
  );
}
