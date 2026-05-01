"use client";

import { useEffect, useState } from "react";
import { Github, FileText, Sparkles, Library, Loader2, LogOut } from "lucide-react";
import { PdfUpload, UploadedDoc } from "@/components/upload";
import { Chat } from "@/components/chat";
import { DocumentBrief } from "@/components/document-brief";
import { StudyPackExport } from "@/components/study-export";
import { AuthForms } from "@/components/auth-forms";
import { UserAiSettings } from "@/components/user-ai-settings";
import { AuthQueryBanner } from "@/components/auth-query-banner";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const STACK = ["Next.js 14", "OpenAI", "Supabase pgvector", "Streaming"];

export default function HomePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [doc, setDoc] = useState<UploadedDoc | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefSummary, setBriefSummary] = useState<string | null>(null);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [starterQuestions, setStarterQuestions] = useState<string[]>([]);

  useEffect(() => {
    setDoc(null);
    setBriefSummary(null);
    setBriefError(null);
    setStarterQuestions([]);
    setBriefLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !doc?.documentId) {
      setBriefSummary(null);
      setBriefError(null);
      setStarterQuestions([]);
      setBriefLoading(false);
      return;
    }

    let cancelled = false;
    setBriefLoading(true);
    setBriefError(null);
    setBriefSummary(null);
    setStarterQuestions([]);

    (async () => {
      try {
        const res = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId: doc.documentId }),
        });
        const json = (await res.json()) as {
          summary?: string;
          questions?: string[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setBriefError(json.error ?? "Could not generate a brief for this document.");
          return;
        }
        setBriefSummary(json.summary ?? null);
        setStarterQuestions(Array.isArray(json.questions) ? json.questions : []);
      } catch {
        if (!cancelled)
          setBriefError("Brief request failed. You can still chat — try your own questions.");
      } finally {
        if (!cancelled) setBriefLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [doc?.documentId, user?.id]);

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-[0.35]" aria-hidden />

      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between gap-3 sm:h-16">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
              <FileText className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <div className="min-w-0 leading-tight">
              <span className="font-semibold tracking-tight">RAG Chatbot</span>
              <span className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
                Accounts · encrypted keys · NotebookLM-style workflow
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {user && (
              <>
                <span className="hidden max-w-[140px] truncate text-xs text-muted-foreground sm:inline">
                  {user.email}
                </span>
                <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5 text-xs" onClick={() => void signOut()}>
                  <LogOut className="h-3.5 w-3.5" aria-hidden />
                  Sign out
                </Button>
              </>
            )}
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
        </div>
      </header>

      <AuthQueryBanner />

      {authLoading ? (
        <section className="container flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          <p className="mt-4 text-sm">Checking session…</p>
        </section>
      ) : !user ? (
        <>
          <section className="container relative pt-10 pb-8 sm:pt-14 sm:pb-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-5 inline-flex animate-fade-in items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm opacity-0 [animation-delay:80ms] [animation-fill-mode:forwards]">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                Sign in to upload PDFs and run RAG chat
              </div>
              <h1 className="animate-fade-in bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent opacity-0 [animation-delay:80ms] [animation-fill-mode:forwards] sm:text-4xl">
                Chat with your documents
              </h1>
              <p className="animate-fade-in mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground opacity-0 [animation-delay:140ms] [animation-fill-mode:forwards] sm:text-base">
                Create an account or sign in. Your OpenRouter key is encrypted per user; choose any compatible model from OpenRouter.
              </p>
            </div>
          </section>
          <section className="container pb-20">
            <AuthForms />
          </section>
        </>
      ) : (
        <>
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
                Configure your model and OpenRouter key below, upload a PDF, then use briefs, study export, and citation-aware chat — scoped to your account.
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
                  <div className="flex items-start gap-2">
                    <Library className="mt-0.5 hidden h-4 w-4 shrink-0 text-primary sm:block" aria-hidden />
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight">Sources</h2>
                      <p className="text-xs text-muted-foreground">Upload · brief · study export · starters</p>
                    </div>
                  </div>
                </div>
                <UserAiSettings />
                <PdfUpload onUploaded={setDoc} />
                {(doc?.documentId || briefLoading) && (
                  <DocumentBrief
                    loading={briefLoading}
                    summary={briefSummary}
                    error={briefError && !briefLoading ? briefError : null}
                  />
                )}
                <StudyPackExport documentId={doc?.documentId ?? null} filename={doc?.filename ?? null} />
              </div>

              <div className="space-y-4 lg:pt-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground ring-1 ring-border">
                    2
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold tracking-tight">Studio</h2>
                    <p className="text-xs text-muted-foreground">Streamed answers · citations drawer · transcript tools</p>
                  </div>
                </div>
                <Chat
                  documentId={doc?.documentId ?? null}
                  filename={doc?.filename ?? null}
                  starterQuestions={starterQuestions}
                />
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
