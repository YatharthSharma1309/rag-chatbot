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
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-accent"
            : "border-border hover:border-primary/50 hover:bg-accent/50",
          status === "uploading" && "pointer-events-none opacity-60",
        )}
      >
        <input {...getInputProps()} />
        {status === "uploading" ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Extracting, chunking, and embedding…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <UploadIcon className="h-8 w-8" />
            <p className="text-sm font-medium text-foreground">
              {isDragActive ? "Drop the PDF here" : "Drag a PDF here, or click to select"}
            </p>
            <p className="text-xs">Up to 25 MB · text-based PDFs (no OCR)</p>
          </div>
        )}
      </div>

      {status === "done" && doc && (
        <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              {doc.filename}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {doc.pageCount} pages · {doc.chunkCount} chunks indexed · ready to chat
            </p>
          </div>
        </div>
      )}

      {status === "error" && error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
          <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
