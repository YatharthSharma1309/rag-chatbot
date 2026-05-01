import OpenAI from "openai";

let client: OpenAI | null = null;

/**
 * Lazily creates the OpenAI client so `next build` can load route modules
 * without OPENAI_API_KEY (newer SDK throws if apiKey is missing at construct time).
 */
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error(
      "OPENAI_API_KEY is not set — add it to .env.local (required for embeddings and chat).",
    );
  }
  if (!client) {
    client = new OpenAI({ apiKey });
  }
  return client;
}

export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";
export const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

// text-embedding-3-small produces 1536-dim vectors (matches Supabase schema)
export const EMBEDDING_DIMENSIONS = 1536;
