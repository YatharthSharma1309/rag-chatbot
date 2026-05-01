"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, User, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-muted-foreground/70"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </span>
  );
}

export function MessageBubble({
  message,
  isThinking,
}: {
  message: ChatMessage;
  isThinking?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  if (message.role === "system") return null;
  const isUser = message.role === "user";

  function copyContent() {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={cn("group flex gap-3 animate-fade-in opacity-0 [animation-fill-mode:forwards]", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 ring-1 ring-primary/20">
          <Bot className="h-4 w-4 text-primary" aria-hidden />
        </div>
      )}
      <div className="relative">
        <div
          className={cn(
            "markdown-body max-w-[min(85%,28rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ring-1",
            isUser && "markdown-body-user",
            isUser
              ? "rounded-br-md bg-primary text-primary-foreground ring-primary/25"
              : "rounded-bl-md bg-card text-card-foreground ring-border/80",
          )}
        >
          {isThinking ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <ThinkingDots />
              <span className="text-xs">Thinking…</span>
            </span>
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
        </div>
        {!isUser && !isThinking && message.content && (
          <button
            onClick={copyContent}
            aria-label="Copy message"
            className="absolute -bottom-2 -right-2 flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-background opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        )}
      </div>
      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary ring-1 ring-border">
          <User className="h-4 w-4 text-secondary-foreground" aria-hidden />
        </div>
      )}
    </div>
  );
}
