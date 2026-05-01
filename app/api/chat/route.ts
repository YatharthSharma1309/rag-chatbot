import { NextRequest } from "next/server";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { openai, CHAT_MODEL } from "@/lib/openai";
import { embedQuery } from "@/lib/embeddings";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 30;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatBody {
  messages: ChatMessage[];
  documentId?: string;
}

const SYSTEM_PROMPT = `You are a helpful AI assistant that answers questions using the provided document excerpts as your primary source of truth.

RULES:
1. Base your answers strictly on the CONTEXT below. If the context does not contain the answer, say so clearly.
2. Cite the source chunks you used inline like [#1], [#2] referring to the chunk numbers shown in the context.
3. Be concise and accurate. Do not invent facts.
4. If the user asks something off-topic from the document, gently redirect them to ask about the document.`;

/**
 * POST /api/chat
 *
 * Body: { messages: ChatMessage[], documentId?: string }
 *
 * Performs vector search against the most recent user message, builds a
 * RAG-augmented prompt, and streams the assistant's response.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatBody;
    const { messages, documentId } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
      });
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) {
      return new Response(JSON.stringify({ error: "No user message" }), {
        status: 400,
      });
    }

    // 1. Embed the user's question
    const queryEmbedding = await embedQuery(lastUser.content);

    // 2. Vector-search the chunks via the SQL RPC defined in supabase/schema.sql
    const supabase = getSupabaseAdmin();
    const { data: matches, error } = await supabase.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_count: 5,
      filter_document_id: documentId ?? null,
    });

    if (error) {
      console.error("[chat] vector search error:", error);
      throw error;
    }

    // 3. Build context block
    const contextBlock =
      matches && matches.length > 0
        ? matches
            .map(
              (m: { chunk_index: number; content: string; similarity: number }, i: number) =>
                `[#${i + 1}] (chunk ${m.chunk_index}, similarity ${m.similarity.toFixed(3)})\n${m.content}`,
            )
            .join("\n\n---\n\n")
        : "(no matching context found — answer from general knowledge but tell the user no document context was found)";

    const systemMessage: ChatMessage = {
      role: "system",
      content: `${SYSTEM_PROMPT}\n\nCONTEXT:\n${contextBlock}`,
    };

    // 4. Stream the chat completion
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      stream: true,
      temperature: 0.2,
      messages: [systemMessage, ...messages.filter((m) => m.role !== "system")],
    });

    // OpenAI SDK stream chunks diverge slightly from `ai`'s union typing (Azure vs OpenAI).
    const stream = OpenAIStream(response as Parameters<typeof OpenAIStream>[0]);
    return new StreamingTextResponse(stream);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/chat] error:", err);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
