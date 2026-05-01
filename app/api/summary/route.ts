import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getChatClient, CHAT_MODEL } from "@/lib/openai";
import { embedQuery } from "@/lib/embeddings";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 30;

const SUMMARY_PROMPT = `You are a document analyst. Given the excerpts below, respond with ONLY valid JSON — no markdown, no extra text:

{
  "summary": "2-3 sentence overview of what this document is about and its main purpose",
  "questions": [
    "specific question 1 a reader would want answered",
    "specific question 2 a reader would want answered",
    "specific question 3 a reader would want answered"
  ]
}

Make the questions specific to this document's actual content, not generic.`;

export async function POST(req: NextRequest) {
  try {
    const { documentId } = (await req.json()) as { documentId?: string };
    if (!documentId)
      return NextResponse.json({ error: "documentId required" }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const queryEmbedding = await embedQuery(
      "overview introduction summary key topics main points conclusions",
    );

    const { data: chunks, error } = await supabase.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_count: 8,
      filter_document_id: documentId,
    });

    if (error) throw error;

    const context =
      chunks && chunks.length > 0
        ? chunks
            .map(
              (c: { chunk_index: number; content: string }, i: number) =>
                `[#${i + 1}] ${c.content}`,
            )
            .join("\n\n---\n\n")
        : "(no content found)";

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
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SUMMARY_PROMPT },
        { role: "user", content: `DOCUMENT EXCERPTS:\n\n${context}` },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { summary?: string; questions?: string[] };

    return NextResponse.json({
      summary: parsed.summary ?? "Document indexed and ready.",
      questions: Array.isArray(parsed.questions) ? parsed.questions.slice(0, 3) : [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    console.error("[/api/summary]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
