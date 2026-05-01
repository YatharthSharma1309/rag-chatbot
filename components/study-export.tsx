"use client";

import { useCallback, useState } from "react";
import { Download, Copy, Check, Loader2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildStudyPackMarkdown, type StudyFlashcard } from "@/lib/study-export-format";
import { flashcardsToCsv } from "@/lib/study-export-csv";

interface StudyPackExportProps {
  documentId: string | null;
  filename: string | null;
}

export function StudyPackExport({ documentId, filename }: StudyPackExportProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<StudyFlashcard[]>([]);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    if (!documentId?.trim()) return;
    setBusy(true);
    setError(null);
    setCopied(false);
    setFlashcards([]);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const res = await fetch("/api/study-export", {
        method: "POST",
        headers,
        body: JSON.stringify({ documentId }),
      });
      const json = (await res.json()) as {
        outline?: string;
        flashcards?: { front: string; back: string }[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? `Study export failed (${res.status})`);
      const cards = Array.isArray(json.flashcards) ? json.flashcards : [];
      const md = buildStudyPackMarkdown({
        sourceTitle: filename ?? "Uploaded PDF",
        outline: json.outline ?? "",
        flashcards: cards,
      });
      setMarkdown(md);
      setFlashcards(cards);
    } catch (e) {
      setMarkdown(null);
      setFlashcards([]);
      setError(e instanceof Error ? e.message : "Study export failed");
    } finally {
      setBusy(false);
    }
  }, [documentId, filename]);

  const downloadMd = useCallback(() => {
    if (!markdown) return;
    const base =
      (filename ?? "document").replace(/\.pdf$/i, "").replace(/[^\w\-]+/g, "-").slice(0, 72) ||
      "study-pack";
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${base}-study-pack.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [markdown, filename]);

  const copyMd = useCallback(() => {
    if (!markdown) return;
    void navigator.clipboard.writeText(markdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [markdown]);

  const downloadCsv = useCallback(() => {
    if (flashcards.length === 0) return;
    const base =
      (filename ?? "document").replace(/\.pdf$/i, "").replace(/[^\w\-]+/g, "-").slice(0, 72) ||
      "study-pack";
    const csv = flashcardsToCsv(flashcards);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${base}-flashcards.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [flashcards, filename]);

  if (!documentId) return null;

  return (
    <div className="rounded-xl border border-border/80 bg-card/70 p-4 shadow-sm ring-1 ring-white/[0.04] backdrop-blur-sm">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <GraduationCap className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        Study pack export
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Useful for revision — Markdown for notes, CSV columns `front` / `back` for Anki import.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={markdown ? "outline" : "default"}
          className="h-9 text-xs"
          disabled={busy}
          onClick={() => void generate()}
        >
          {busy ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
              Generating…
            </>
          ) : markdown ? (
            "Regenerate"
          ) : (
            "Generate study pack"
          )}
        </Button>
        {markdown && (
          <>
            <Button type="button" size="sm" variant="outline" className="h-9 text-xs" onClick={copyMd}>
              {copied ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" aria-hidden />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Copy Markdown
                </>
              )}
            </Button>
            <Button type="button" size="sm" variant="outline" className="h-9 text-xs" onClick={downloadCsv} disabled={flashcards.length === 0}>
              <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Download CSV
            </Button>
            <Button type="button" size="sm" variant="outline" className="h-9 text-xs" onClick={downloadMd}>
              <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Download .md
            </Button>
          </>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {markdown && !error && (
        <details className="mt-3 rounded-lg border border-border/70 bg-muted/20">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
            Preview (truncated)
          </summary>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words border-t border-border/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground/90">
            {markdown.length > 1200 ? `${markdown.slice(0, 1200)}…` : markdown}
          </pre>
        </details>
      )}
    </div>
  );
}
