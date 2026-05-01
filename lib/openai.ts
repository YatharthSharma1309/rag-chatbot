import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  // Don't throw at import time so `next build` works without env vars.
  // The error will surface clearly on the first API call instead.
  console.warn("[openai] OPENAI_API_KEY is not set — set it in .env.local");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";
export const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

// text-embedding-3-small produces 1536-dim vectors (matches Supabase schema)
export const EMBEDDING_DIMENSIONS = 1536;
