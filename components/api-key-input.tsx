"use client";

import { useEffect, useState } from "react";
import { Key, Eye, EyeOff, CheckCircle2, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "rag_openrouter_key";

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setApiKey(stored);
  }, []);

  function saveKey(key: string) {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
  }

  function clearKey() {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey(null);
  }

  return { apiKey, saveKey, clearKey };
}

interface ApiKeyInputProps {
  apiKey: string | null;
  onSave: (key: string) => void;
  onClear: () => void;
}

export function ApiKeyInput({ apiKey, onSave, onClear }: ApiKeyInputProps) {
  const [draft, setDraft] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [expanded, setExpanded] = useState(false);

  function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed.startsWith("sk-or-")) return;
    onSave(trimmed);
    setDraft("");
    setExpanded(false);
  }

  const masked = apiKey
    ? `${apiKey.slice(0, 10)}${"•".repeat(10)}${apiKey.slice(-4)}`
    : null;

  return (
    <div className="rounded-xl border border-border/70 bg-card/80 shadow-sm">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 transition-colors",
            apiKey
              ? "bg-emerald-500/15 ring-emerald-500/30"
              : "bg-muted/70 ring-border",
          )}
        >
          <Key
            className={cn(
              "h-4 w-4",
              apiKey ? "text-emerald-500" : "text-muted-foreground",
            )}
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight">
            {apiKey ? "Your OpenRouter key is set" : "Use your own API key"}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {apiKey
              ? masked
              : "Avoids draining the shared free limit — get a free key"}
          </p>
        </div>
        {apiKey && (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border/60 px-4 pb-4 pt-3 space-y-3">
          {apiKey ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
              <span className="font-mono text-xs text-muted-foreground">
                {showKey ? apiKey : masked}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowKey((v) => !v)}
                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showKey ? "Hide key" : "Show key"}
                >
                  {showKey ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  onClick={onClear}
                  className="rounded p-1 text-muted-foreground hover:text-destructive"
                  aria-label="Remove key"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder="sk-or-v1-…"
                  className="h-9 flex-1 rounded-lg border border-border/80 bg-background/80 px-3 font-mono text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  onClick={handleSave}
                  disabled={!draft.trim().startsWith("sk-or-")}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
                >
                  Save
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Free key at{" "}
                <a
                  href="https://openrouter.ai/settings/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary underline underline-offset-2 hover:opacity-80"
                >
                  openrouter.ai
                  <ExternalLink className="h-3 w-3" />
                </a>
                . Stored only in your browser.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
