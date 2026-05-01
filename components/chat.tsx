"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageBubble, ChatMessage } from "@/components/message";

interface ChatProps {
  documentId: string | null;
  filename: string | null;
}

export function Chat({ documentId, filename }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [documentId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };
    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    const next = [...messages, userMsg, assistantMsg];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const truncatedName =
    filename && filename.length > 42 ? `${filename.slice(0, 39)}…` : filename;

  return (
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
                Indexed · answers use your document context
              </p>
            )}
          </div>
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
                ? "Try summarizing key points, clarifying definitions, or citing specific sections."
                : "Drop a PDF on the left to index it. Chat stays scoped to that file."}
            </p>
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            isThinking={m.role === "assistant" && busy && m.content === ""}
          />
        ))}
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
  );
}
