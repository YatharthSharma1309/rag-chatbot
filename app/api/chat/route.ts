import { NextRequest } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-api";
import { assertDocumentOwnedByUser } from "@/lib/document-access";
import { loadUserLlmCredentials, createUserOpenRouterClient } from "@/lib/user-llm";
import {
  matchChunksForDocumentQuery,
  buildContextBlockFromMatches,
} from "@/lib/rag-context";

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
 * Body: { messages: ChatMessage[], documentId: string }
 *
 * Requires Supabase session. Uses the signed-in user's stored OpenRouter key and model.
 * documentId must belong to the user.
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = (await req.json()) as ChatBody;
    const { messages, documentId } = body;

    if (!documentId?.trim()) {
      return new Response(JSON.stringify({ error: "documentId required" }), { status: 400 });
    }

    const docId = documentId.trim();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
      });
    }

    if (messages.length > 50) {
      return new Response(JSON.stringify({ error: "Too many messages (max 50)" }), {
        status: 400,
      });
    }

    for (const m of messages) {
      if (typeof m.content === "string" && m.content.length > 4000) {
        return new Response(JSON.stringify({ error: "Message too long (max 4000 chars)" }), {
          status: 400,
        });
      }
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) {
      return new Response(JSON.stringify({ error: "No user message" }), {
        status: 400,
      });
    }

    try {
      await assertDocumentOwnedByUser(docId, userId);
    } catch {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const matches = await matchChunksForDocumentQuery(lastUser.content, docId);
    const contextBlock = buildContextBlockFromMatches(matches);

    const systemMessage: ChatMessage = {
      role: "system",
      content: `${SYSTEM_PROMPT}\n\nCONTEXT:\n${contextBlock}`,
    };

    const creds = await loadUserLlmCredentials(userId);
    if (!creds) {
      return new Response(
        JSON.stringify({
          error: "Add your OpenRouter API key in AI settings before chatting.",
        }),
        { status: 400 },
      );
    }

    const chatClient = createUserOpenRouterClient(creds.apiKey);

    const response = await chatClient.chat.completions.create({
      model: creds.chatModel,
      stream: true,
      temperature: 0.2,
      messages: [systemMessage, ...messages.filter((m) => m.role !== "system")],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });
    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : JSON.stringify(err);
    console.error("[/api/chat] error:", err);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
