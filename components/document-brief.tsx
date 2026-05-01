"use client";

import { BookOpen, Loader2, Sparkles } from "lucide-react";

interface DocumentBriefProps {
  loading: boolean;
  summary: string | null;
  error: string | null;
}

export function DocumentBrief({ loading, summary, error }: DocumentBriefProps) {
  if (!loading && !summary && !error) return null;

  return (
    <div className="rounded-xl border border-border/80 bg-card/70 p-4 shadow-sm ring-1 ring-white/[0.04] backdrop-blur-sm">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        Document brief
      </div>

      {loading && (
        <div className="mt-3 flex items-start gap-3 text-sm text-muted-foreground">
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden />
          <p>Reading representative passages and drafting a short overview…</p>
        </div>
      )}

      {!loading && error && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{error}</p>
      )}

      {!loading && summary && (
        <>
          <div className="mt-3 flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 ring-1 ring-primary/25">
              <BookOpen className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <p className="text-sm leading-relaxed text-foreground/95">{summary}</p>
          </div>
          <p className="mt-3 border-t border-border/60 pt-3 text-[11px] leading-relaxed text-muted-foreground">
            Suggested questions below are tailored to this file — similar to a source guide, but grounded in your vector index.
          </p>
        </>
      )}
    </div>
  );
}
