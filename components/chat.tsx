"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
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

  // Auto-scroll on new content
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset chat when a new document is uploaded
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

      // Stream the assistant response
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
      // Remove the empty assistant placeholder
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-[600px] rounded-lg border bg-card">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="text-sm font-medium">
          {filename ? `Chatting with: ${filename}` : "Chat"}
        </div>
        {!documentId && (
          <div className="text-xs text-muted-foreground mt-0.5">
            Upload a PDF to start asking questions
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center text-sm text-muted-foreground px-8">
            {documentId
              ? "Ask anything about your document. Try: “Summarize the key points” or “What does the document say about X?”"
              : "No document loaded yet."}
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={documentId ? "Ask a question…" : "Upload a PDF first"}
          disabled={!documentId || busy}
          autoFocus
        />
        <Button type="submit" disabled={!documentId || busy || !input.trim()} size="icon">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
