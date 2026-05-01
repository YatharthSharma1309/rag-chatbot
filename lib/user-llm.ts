import OpenAI from "openai";
import { getSupabaseAdmin } from "@/lib/supabase";
import { decryptOpenRouterKey } from "@/lib/crypto-user-settings";
import { CHAT_MODEL as DEFAULT_CHAT_MODEL } from "@/lib/openai";

export type UserLlmCredentials = {
  apiKey: string;
  chatModel: string;
};

export async function loadUserLlmCredentials(userId: string): Promise<UserLlmCredentials | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("user_settings")
    .select("encrypted_openrouter_key, preferred_chat_model")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.encrypted_openrouter_key) return null;

  let apiKey: string;
  try {
    apiKey = decryptOpenRouterKey(data.encrypted_openrouter_key);
  } catch {
    throw new Error("Could not decrypt stored API key — check USER_SETTINGS_ENCRYPTION_KEY");
  }

  const chatModel =
    typeof data.preferred_chat_model === "string" && data.preferred_chat_model.trim()
      ? data.preferred_chat_model.trim()
      : DEFAULT_CHAT_MODEL;

  return { apiKey, chatModel };
}

export function createUserOpenRouterClient(apiKey: string) {
  return new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer":
        process.env.OPENROUTER_HTTP_REFERER?.trim() ||
        process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
        "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_APP_TITLE?.trim() || "RAG Chatbot",
    },
  });
}
