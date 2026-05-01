"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Cpu, Eye, EyeOff, Key, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SUGGESTED_OPENROUTER_MODELS } from "@/lib/openrouter-models";

/** OpenRouter API key + chat model — persisted per user via /api/user/settings (encrypted server-side). */
export function UserAiSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [model, setModel] = useState<string>(SUGGESTED_OPENROUTER_MODELS[0].id);
  const [keyDraft, setKeyDraft] = useState("");
  const [clearKey, setClearKey] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [setupHint, setSetupHint] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/user/settings");
      const json = (await res.json()) as {
        preferredChatModel?: string;
        hasOpenRouterKey?: boolean;
        databaseSetupRequired?: boolean;
        setupHint?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Could not load settings");
      if (json.preferredChatModel) setModel(json.preferredChatModel);
      setHasStoredKey(!!json.hasOpenRouterKey);
      setSetupHint(json.databaseSetupRequired && json.setupHint ? json.setupHint : null);
    } catch (e) {
      setSetupHint(null);
      setErr(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const body: {
        preferredChatModel: string;
        openrouterKey?: string;
        clearOpenrouterKey?: boolean;
      } = { preferredChatModel: model.trim() };

      if (clearKey) body.clearOpenrouterKey = true;
      else if (keyDraft.trim()) body.openrouterKey = keyDraft.trim();

      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; hasOpenRouterKey?: boolean };
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setMsg("Saved. Summaries, chat, and study export use this model and key.");
      setKeyDraft("");
      setClearKey(false);
      setHasStoredKey(!!json.hasOpenRouterKey);
      void load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const modelListId = "openrouter-model-suggestions";

  return (
    <div className="rounded-xl border border-border/70 bg-card/80 shadow-sm">
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 ring-1 ring-primary/25">
          <Cpu className="h-4 w-4 text-primary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">AI settings</p>
          <p className="text-xs text-muted-foreground">
            OpenRouter model + API key · stored encrypted · used for chat, brief, study pack
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading settings…
        </div>
      ) : (
        <form className="space-y-4 px-4 py-4" onSubmit={handleSave}>
          {setupHint && (
            <p className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
              {setupHint}
            </p>
          )}
          <div>
            <label htmlFor="chat-model" className="text-xs font-medium text-muted-foreground">
              Chat model (OpenRouter id)
            </label>
            <Input
              id="chat-model"
              list={modelListId}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-1.5 h-10 border-border/80 bg-background/80 font-mono text-xs"
              placeholder="e.g. openai/gpt-oss-20b:free"
              required
            />
            <datalist id={modelListId}>
              {SUGGESTED_OPENROUTER_MODELS.map((m) => (
                <option key={m.id} value={m.id} label={m.label} />
              ))}
            </datalist>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Pick a suggestion or paste any model id from{" "}
              <a
                href="https://openrouter.ai/models"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-2"
              >
                openrouter.ai/models
              </a>
              .
            </p>
          </div>

          <div>
            <label htmlFor="or-key" className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Key className="h-3 w-3" aria-hidden />
              OpenRouter API key
              {hasStoredKey && (
                <span className="rounded bg-emerald-500/15 px-1.5 py-0 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  saved
                </span>
              )}
            </label>
            <div className="relative mt-1.5">
              <Input
                id="or-key"
                type={showKey ? "text" : "password"}
                autoComplete="off"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                className="h-10 border-border/80 bg-background/80 pr-10 font-mono text-xs"
                placeholder={hasStoredKey ? "Leave blank to keep existing key" : "sk-or-v1-…"}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={clearKey}
              onChange={(e) => setClearKey(e.target.checked)}
              className="rounded border-border"
            />
            Remove saved API key from my account
          </label>

          {err && (
            <p className="rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {err}
            </p>
          )}
          {msg && (
            <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
              {msg}
            </p>
          )}

          <Button type="submit" disabled={saving} className="h-10 w-full sm:w-auto">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" aria-hidden />
                Save AI settings
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
