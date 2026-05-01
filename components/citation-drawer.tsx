"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, BookMarked, Gauge } from "lucide-react";
import type { MatchedChunk } from "@/lib/rag-context";
import { Button } from "@/components/ui/button";

export type CitationDrawerState =
  | { open: false }
  | {
      open: true;
      slot: number;
      loading: boolean;
      error: string | null;
      chunks: MatchedChunk[] | null;
    };

interface CitationDrawerProps {
  state: CitationDrawerState;
  onClose: () => void;
}

export function CitationDrawer({ state, onClose }: CitationDrawerProps) {
  useEffect(() => {
    if (!state.open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.open, onClose]);

  if (!state.open || typeof document === "undefined") return null;

  const chunk =
    state.chunks && state.chunks.length > 0
      ? state.chunks.find((c) => c.slot === state.slot) ?? null
      : null;

  const portal = (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Close source panel"
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-md flex-col border-l border-border/80 bg-card shadow-2xl shadow-black/40"
        role="dialog"
        aria-modal="true"
        aria-labelledby="citation-drawer-title"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border/70 px-4 py-3">
          <div className="min-w-0">
            <p id="citation-drawer-title" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <BookMarked className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              Retrieved passage
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Matches the [#{state.slot}] label for this answer — same embedding search as chat.
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden">
          {state.loading && (
            <div className="flex flex-1 flex-col justify-center px-6 py-10 text-center text-sm text-muted-foreground">
              Loading chunks…
            </div>
          )}
          {!state.loading && state.error && (
            <div className="m-4 rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {state.error}
            </div>
          )}
          {!state.loading && !state.error && chunk && (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-border/50 px-4 py-2.5 text-[11px] text-muted-foreground">
                <span className="rounded-md bg-primary/12 px-2 py-0.5 font-medium text-primary">
                  #{state.slot}
                </span>
                <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px]">
                  chunk_index {chunk.chunk_index}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono">
                  <Gauge className="h-3 w-3 opacity-70" aria-hidden />
                  {chunk.similarity.toFixed(3)}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground/95">
                  {chunk.content}
                </pre>
              </div>
            </>
          )}
          {!state.loading && !state.error && state.chunks && !chunk && (
            <div className="m-4 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
              No chunk found for [#{state.slot}]. Try asking again — retrieval may have returned fewer than{" "}
              {state.slot} passages.
            </div>
          )}
        </div>
      </aside>
    </div>
  );

  return createPortal(portal, document.body);
}
