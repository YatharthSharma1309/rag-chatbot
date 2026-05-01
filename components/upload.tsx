"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2, FileText, Upload as UploadIcon, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadedDoc {
  documentId: string;
  filename: string;
  chunkCount: number;
  pageCount: number;
}

interface UploadProps {
  onUploaded: (doc: UploadedDoc) => void;
}

type Status = "idle" | "uploading" | "done" | "error";

export function PdfUpload({ onUploaded }: UploadProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [doc, setDoc] = useState<UploadedDoc | null>(null);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setStatus("uploading");
      setError(null);

      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
        setDoc(json);
        setStatus("done");
        onUploaded(json);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        setError(msg);
        setStatus("error");
      }
    },
    [onUploaded],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: status === "uploading",
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200",
          isDragActive
            ? "border-primary bg-primary/10 shadow-[0_0_32px_-8px_hsl(var(--primary)/0.45)]"
            : "border-border/90 bg-card/90 hover:border-primary/45 hover:bg-accent/30",
          status === "uploading" && "pointer-events-none opacity-75",
        )}
      >
        <input {...getInputProps()} />
        {status === "uploading" && (
          <div
            className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"
            aria-hidden
          />
        )}
        <div className="relative px-8 py-12 text-center">
          {status === "uploading" ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
              <div>
                <p className="text-sm font-medium text-foreground">Processing your PDF</p>
                <p className="mt-1 text-xs text-muted-foreground">Extract → chunk → embed → store</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl ring-1 transition-colors",
                  isDragActive ? "bg-primary/20 ring-primary/30" : "bg-muted/80 ring-border group-hover:bg-accent",
                )}
              >
                <UploadIcon
                  className={cn("h-7 w-7 transition-colors", isDragActive ? "text-primary" : "text-muted-foreground")}
                  aria-hidden
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isDragActive ? "Drop to upload" : "Drag PDF here or click to browse"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Max 25 MB · needs selectable text (no OCR)</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {status === "done" && doc && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/35 bg-emerald-500/[0.08] px-4 py-3 text-sm shadow-sm ring-1 ring-emerald-500/15">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-medium">
              <FileText className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              <span className="truncate">{doc.filename}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {doc.pageCount} pages · {doc.chunkCount} chunks · ready to chat
            </p>
          </div>
        </div>
      )}

      {status === "error" && error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm ring-1 ring-destructive/10">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
          <p className="text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
