import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getChatClient, CHAT_MODEL } from "@/lib/openai";
import { embedQuery } from "@/lib/embeddings";
import { getSupabaseAdmin } from "@/lib/supabase";
import { STUDY_EXPORT_PROMPT } from "@/lib/study-export-prompt";
import type { StudyFlashcard } from "@/lib/study-export-format";

export const runtime = "nodejs";
export const maxDuration = 60;

const STUDY_CHUNK_QUERY =
  "study outline concepts definitions key terms facts procedures timeline arguments themes vocabulary";

export async function POST(req: NextRequest) {
  try {
    const { documentId } = (await req.json()) as { documentId?: string };
    if (!documentId?.trim()) {
      return NextResponse.json({ error: "documentId required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const queryEmbedding = await embedQuery(STUDY_CHUNK_QUERY);

    const { data: chunks, error } = await supabase.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_count: 12,
      filter_document_id: documentId.trim(),
    });

    if (error) throw error;

    const context =
      chunks && chunks.length > 0
        ? chunks
            .map(
              (c: { chunk_index: number; content: string }, i: number) =>
                `[#${i + 1}] (chunk ${c.chunk_index})\n${c.content}`,
            )
            .join("\n\n---\n\n")
        : "(no content found in vector index for this document)";

    const userKey = req.headers.get("x-openrouter-key")?.trim();
    const client = userKey
      ? new OpenAI({
          apiKey: userKey,
          baseURL: "https://openrouter.ai/api/v1",
          defaultHeaders: {
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "RAG Chatbot",
          },
        })
      : getChatClient();

    const response = await client.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: STUDY_EXPORT_PROMPT },
        { role: "user", content: `DOCUMENT EXCERPTS:\n\n${context}` },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      outline?: string;
      flashcards?: unknown;
    };

    let flashcards: StudyFlashcard[] = [];
    if (Array.isArray(parsed.flashcards)) {
      flashcards = parsed.flashcards
        .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
        .map((x) => ({
          front: typeof x.front === "string" ? x.front : "",
          back: typeof x.back === "string" ? x.back : "",
        }))
        .filter((c) => c.front.trim() || c.back.trim())
        .slice(0, 16);
    }

    return NextResponse.json({
      outline: typeof parsed.outline === "string" ? parsed.outline : "",
      flashcards,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    console.error("[/api/study-export]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
