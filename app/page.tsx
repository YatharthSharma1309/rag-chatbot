"use client";

import { useState } from "react";
import { Github, FileText } from "lucide-react";
import { PdfUpload, UploadedDoc } from "@/components/upload";
import { Chat } from "@/components/chat";

export default function HomePage() {
  const [doc, setDoc] = useState<UploadedDoc | null>(null);

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span className="font-semibold">RAG Chatbot</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              · chat with your PDFs
            </span>
          </div>
          <a
            href="https://github.com/YatharthSharma1309/rag-chatbot"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="View source on GitHub"
          >
            <Github className="h-5 w-5" />
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-10">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Chat with your documents
          </h1>
          <p className="mt-3 text-muted-foreground">
            Upload a PDF and ask anything. Powered by OpenAI embeddings, Supabase pgvector,
            and streaming GPT-4o-mini responses with source citations.
          </p>
        </div>
      </section>

      {/* Two-column layout */}
      <section className="container pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              1. Upload
            </h2>
            <PdfUpload onUploaded={setDoc} />
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              2. Chat
            </h2>
            <Chat documentId={doc?.documentId ?? null} filename={doc?.filename ?? null} />
          </div>
        </div>
      </section>
    </main>
  );
}
