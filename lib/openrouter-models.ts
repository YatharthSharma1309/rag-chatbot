/** Suggested OpenRouter model ids — users can still type any valid id */
export const SUGGESTED_OPENROUTER_MODELS = [
  { id: "openai/gpt-oss-20b:free", label: "GPT-OSS 20B (free)" },
  { id: "google/gemma-3-27b-it:free", label: "Gemma 3 27B (free)" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (free)" },
  { id: "qwen/qwen-2.5-72b-instruct:free", label: "Qwen 2.5 72B (free)" },
  { id: "deepseek/deepseek-r1-distill-llama-70b:free", label: "DeepSeek R1 distill (free)" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o mini (paid)" },
  { id: "anthropic/claude-3.5-haiku", label: "Claude 3.5 Haiku (paid)" },
] as const;

const MODEL_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9/_.:-]{0,127}$/;

export function isValidOpenRouterModelId(id: string): boolean {
  const t = id.trim();
  return t.length > 0 && t.length <= 128 && MODEL_ID_RE.test(t);
}
