"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Send, Loader2, MessageSquare, Trash2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageBubble, ChatMessage } from "@/components/message";
import { CitationDrawer, type CitationDrawerState } from "@/components/citation-drawer";
import type { MatchedChunk } from "@/lib/rag-context";

function precedingUserContent(messages: ChatMessage[], assistantIndex: number): string | null {
  for (let i = assistantIndex - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content;
  }
  return null;
}

const FALLBACK_PROMPTS = [
  "Summarize the key points",
  "What are the main conclusions?",
  "List any figures, tables, or statistics",
];

interface ChatProps {
  documentId: string | null;
  filename: string | null;
  /** AI-generated starters from /api/summary; mixed with fallbacks when short */
  starterQuestions?: string[];
}

export function Chat({ documentId, filename, starterQuestions = [] }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedTx, setCopiedTx] = useState(false);
  const [drawer, setDrawer] = useState<CitationDrawerState>({ open: false });
  const scrollRef = useRef<HTMLDivElement>(null);
  const chunksCacheRef = useRef<Map<string, MatchedChunk[]>>(new Map());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setMessages([]);
    setError(null);
    setCopiedTx(false);
    setDrawer({ open: false });
    chunksCacheRef.current.clear();
  }, [documentId]);

  async function openCitation(slot: number, query: string | null) {
    if (!documentId || !query?.trim()) return;
    const cacheKey = `${documentId}\n${query}`;
    setDrawer({ open: true, slot, loading: true, error: null, chunks: null });

    const cached = chunksCacheRef.current.get(cacheKey);
    if (cached) {
      setDrawer({ open: true, slot, loading: false, error: null, chunks: cached });
      return;
    }

    try {
      const res = await fetch("/api/chunks-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, query }),
      });
      const json = (await res.json()) as { chunks?: MatchedChunk[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? `Preview failed (${res.status})`);
      const chunks = json.chunks ?? [];
      chunksCacheRef.current.set(cacheKey, chunks);
      setDrawer({ open: true, slot, loading: false, error: null, chunks });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load passage";
      setDrawer({ open: true, slot, loading: false, error: msg, chunks: null });
    }
  }

  async function send(text: string) {
    if (!text.trim() || busy) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
    };
    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setBusy(true);
    setError(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })),
          documentId,
        }),
      });

      if (!res.ok || !res.body) {
        const errPayload = await res.json().catch(() => ({}));
        throw new Error(errPayload.error || `Chat failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await send(input);
  }

  const truncatedName =
    filename && filename.length > 42 ? `${filename.slice(0, 39)}…` : filename;

  const promptChips = useMemo(() => {
    const merged = [...starterQuestions];
    for (const p of FALLBACK_PROMPTS) {
      if (merged.length >= 5) break;
      if (!merged.some((x) => x.toLowerCase() === p.toLowerCase())) merged.push(p);
    }
    return merged.slice(0, 5);
  }, [starterQuestions]);

  function clearChat() {
    setMessages([]);
    setError(null);
    setDrawer({ open: false });
  }

  function copyTranscript() {
    if (messages.length === 0) return;
    const lines = messages
      .filter((m) => m.role !== "system")
      .map((m) => {
        const label = m.role === "user" ? "You" : "Assistant";
        return `**${label}**\n${m.content}`;
      });
    void navigator.clipboard.writeText(lines.join("\n\n---\n\n")).then(() => {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    });
  }

  return (
    <>
    <div className="flex h-[min(600px,calc(100vh-14rem))] min-h-[420px] flex-col overflow-hidden rounded-xl border border-border/80 bg-card/90 shadow-xl shadow-black/20 ring-1 ring-white/[0.04] backdrop-blur-sm">
      <div className="border-b border-border/70 bg-muted/25 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="truncate">{truncatedName ?? "Assistant"}</span>
            </div>
            {!documentId ? (
              <p className="mt-1 text-xs text-muted-foreground">Upload a PDF to unlock questions.</p>
            ) : (
              <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Tap [#1], [#2]… to open the source passage · same retrieval as the model
              </p>
            )}
          </div>
          {documentId && (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={copyTranscript}
                disabled={messages.length === 0 || busy}
                title={copiedTx ? "Copied" : "Copy full transcript"}
              >
                <ClipboardList className="mr-1 h-3.5 w-3.5" aria-hidden />
                {copiedTx ? "Copied" : "Copy"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={clearChat}
                disabled={messages.length === 0 || busy}
                title="Clear conversation"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden />
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/80 ring-1 ring-border">
              <MessageSquare className="h-7 w-7 text-muted-foreground" aria-hidden />
            </div>
            <p className="max-w-[260px] text-sm font-medium text-foreground">
              {documentId ? "Ask your first question" : "Waiting for a document"}
            </p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
              {documentId
                ? "Try one of these or ask anything about the document."
                : "Drop a PDF on the left to index it. Chat stays scoped to that file."}
            </p>
            {documentId && (
              <div className="mt-4 flex w-full max-w-xs flex-col gap-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/90">
                  Suggested questions
                </p>
                {promptChips.map((prompt, i) => (
                  <button
                    key={`${i}-${prompt.slice(0, 48)}`}
                    onClick={() => send(prompt)}
                    disabled={busy}
                    className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((m, idx) => {
          const priorUser = m.role === "assistant" ? precedingUserContent(messages, idx) : null;
          const citationsReady =
            !!documentId &&
            m.role === "assistant" &&
            !!priorUser?.trim() &&
            !!m.content.trim();

          return (
            <MessageBubble
              key={m.id}
              message={m}
              isThinking={m.role === "assistant" && busy && m.content === ""}
              citationsEnabled={citationsReady}
              onCitationClick={(slot) => openCitation(slot, priorUser)}
            />
          );
        })}
        {error && (
          <div className="rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border/70 bg-muted/15 p-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={documentId ? "Ask anything about this PDF…" : "Upload a PDF first"}
            disabled={!documentId || busy}
            className="h-11 border-border/80 bg-background/80 shadow-inner"
            autoFocus
          />
          <Button
            type="submit"
            disabled={!documentId || busy || !input.trim()}
            size="icon"
            className="h-11 w-11 shrink-0 shadow-md shadow-primary/15"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
    <CitationDrawer state={drawer} onClose={() => setDrawer({ open: false })} />
    </>
  );
}
