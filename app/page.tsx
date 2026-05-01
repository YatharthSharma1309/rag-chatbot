"use client";

import { useState } from "react";
import { Github, FileText, Sparkles } from "lucide-react";
import { PdfUpload, UploadedDoc } from "@/components/upload";
import { Chat } from "@/components/chat";

const STACK = ["Next.js 14", "OpenAI", "Supabase pgvector", "Streaming"];

export default function HomePage() {
  const [doc, setDoc] = useState<UploadedDoc | null>(null);

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-[0.35]" aria-hidden />

      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between sm:h-16">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
              <FileText className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <div className="leading-tight">
              <span className="font-semibold tracking-tight">RAG Chatbot</span>
              <span className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
                Retrieval-augmented Q&amp;A on your PDFs
              </span>
            </div>
          </div>
          <a
            href="https://github.com/YatharthSharma1309/rag-chatbot"
            target="_blank"
            rel="noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="View source on GitHub"
          >
            <Github className="h-5 w-5" />
          </a>
        </div>
      </header>

      <section className="container relative pt-10 pb-8 sm:pt-14 sm:pb-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex animate-fade-in items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm opacity-0 [animation-delay:80ms] [animation-fill-mode:forwards]">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            Embeddings + vector search + streamed answers
          </div>
          <h1 className="animate-fade-in bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent opacity-0 [animation-delay:80ms] [animation-fill-mode:forwards] sm:text-4xl md:text-[2.65rem] md:leading-[1.15]">
            Chat with your documents
          </h1>
          <p className="animate-fade-in mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground opacity-0 [animation-delay:140ms] [animation-fill-mode:forwards] sm:text-base">
            Upload a PDF, we chunk and embed it into Supabase. Ask questions and get grounded replies with inline citations — streamed token by token.
          </p>
          <ul className="animate-fade-in mt-7 flex flex-wrap items-center justify-center gap-2 opacity-0 [animation-delay:200ms] [animation-fill-mode:forwards]">
            {STACK.map((label) => (
              <li
                key={label}
                className="rounded-md border border-border/70 bg-secondary/40 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs"
              >
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container relative pb-16 sm:pb-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-[0_0_20px_-4px_hsl(var(--primary)/0.55)]">
                1
              </span>
              <div>
                <h2 className="text-sm font-semibold tracking-tight">Upload</h2>
                <p className="text-xs text-muted-foreground">PDF · up to 25 MB · text layer required</p>
              </div>
            </div>
            <PdfUpload onUploaded={setDoc} />
          </div>

          <div className="space-y-4 lg:pt-0">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground ring-1 ring-border">
                2
              </span>
              <div>
                <h2 className="text-sm font-semibold tracking-tight">Chat</h2>
                <p className="text-xs text-muted-foreground">Questions scoped to your uploaded file</p>
              </div>
            </div>
            <Chat documentId={doc?.documentId ?? null} filename={doc?.filename ?? null} />
          </div>
        </div>
      </section>
    </main>
  );
}
