import OpenAI from "openai";

let chatClient: OpenAI | null = null;
let embeddingClient: OpenAI | null = null;

/**
 * Chat client — uses OpenRouter if OPENROUTER_API_KEY is set, otherwise OpenAI directly.
 */
export function getChatClient(): OpenAI {
  if (chatClient) return chatClient;

  const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const apiKey = openrouterKey || openaiKey;

  if (!apiKey) {
    throw new Error("No API key — set OPENAI_API_KEY or OPENROUTER_API_KEY in .env.local");
  }

  let baseURL = process.env.OPENAI_BASE_URL?.trim();
  if (!baseURL && openrouterKey) baseURL = "https://openrouter.ai/api/v1";

  const headers =
    baseURL?.includes("openrouter.ai")
      ? {
          "HTTP-Referer":
            process.env.OPENROUTER_HTTP_REFERER?.trim() ||
            process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
            "http://localhost:3000",
          "X-Title": process.env.OPENROUTER_APP_TITLE?.trim() || "RAG Chatbot",
        }
      : undefined;

  chatClient = new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
    ...(headers ? { defaultHeaders: headers } : {}),
  });
  return chatClient;
}

/**
 * Embedding client — uses Jina AI (free, no credit card) if JINA_API_KEY is set,
 * otherwise falls back to OpenAI directly.
 * Get a free Jina key at: https://jina.ai (1M tokens/month free)
 */
export function getEmbeddingClient(): OpenAI {
  if (embeddingClient) return embeddingClient;

  const jinaKey = process.env.JINA_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  if (jinaKey) {
    embeddingClient = new OpenAI({
      apiKey: jinaKey,
      baseURL: "https://api.jina.ai/v1",
    });
  } else if (openaiKey) {
    embeddingClient = new OpenAI({ apiKey: openaiKey });
  } else {
    throw new Error(
      "No embedding key found. Set JINA_API_KEY (free at jina.ai) or OPENAI_API_KEY in .env.local",
    );
  }

  return embeddingClient;
}

export const CHAT_MODEL =
  process.env.OPENAI_CHAT_MODEL ??
  (process.env.OPENROUTER_API_KEY?.trim()
    ? "openai/gpt-oss-20b:free"
    : "gpt-4o-mini");

// Jina: jina-embeddings-v2-base-en (768 dims, free)
// OpenAI fallback: text-embedding-3-small (1536 dims)
export const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ??
  (process.env.JINA_API_KEY?.trim()
    ? "jina-embeddings-v2-base-en"
    : "text-embedding-3-small");

// 768 for Jina, 1536 for OpenAI — must match the Supabase vector column
export const EMBEDDING_DIMENSIONS = process.env.JINA_API_KEY?.trim() ? 768 : 1536;
