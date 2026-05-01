import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { chunkText, embedChunks } from "@/lib/embeddings";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs"; // pdf-parse needs Node, not Edge
export const maxDuration = 60; // seconds — allow time for embedding large PDFs

/**
 * POST /api/upload
 *
 * Accepts a multipart form with a `file` field (PDF).
 * Extracts text, chunks it, generates embeddings, and stores them in Supabase.
 *
 * Returns: { documentId, filename, chunkCount }
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded. Send a PDF as form field 'file'." },
        { status: 400 },
      );
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are supported." },
        { status: 400 },
      );
    }

    // 25 MB cap — adjust as needed
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Max 25 MB." },
        { status: 413 },
      );
    }

    // 1. Extract text from the PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    // Dynamic import — pdf-parse executes top-level code that fails when bundled
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buffer);
    const fullText = parsed.text;

    if (!fullText || fullText.trim().length < 20) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from this PDF. It may be scanned/image-based — OCR is not enabled.",
        },
        { status: 422 },
      );
    }

    // 2. Chunk the text
    const chunks = chunkText(fullText, { chunkSize: 1000, overlap: 200 });

    // 3. Embed all chunks
    const embeddings = await embedChunks(chunks);

    // 4. Persist to Supabase
    const supabase = getSupabaseAdmin();
    const documentId = randomUUID();

    // Insert document metadata
    const { error: docErr } = await supabase.from("documents").insert({
      id: documentId,
      filename: file.name,
      page_count: parsed.numpages,
      char_count: fullText.length,
      chunk_count: chunks.length,
    });
    if (docErr) throw docErr;

    // Insert chunks (batched to keep payload reasonable)
    const rows = chunks.map((content, i) => ({
      document_id: documentId,
      chunk_index: i,
      content,
      embedding: embeddings[i],
    }));

    const batchSize = 200;
    for (let i = 0; i < rows.length; i += batchSize) {
      const { error: chunkErr } = await supabase
        .from("document_chunks")
        .insert(rows.slice(i, i + batchSize));
      if (chunkErr) throw chunkErr;
    }

    return NextResponse.json({
      documentId,
      filename: file.name,
      chunkCount: chunks.length,
      pageCount: parsed.numpages,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/upload] error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
