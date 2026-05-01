import { getOpenAI, EMBEDDING_MODEL } from "./openai";

/**
 * Split text into overlapping chunks suitable for embedding.
 *
 * Strategy: paragraph-aware sliding window.
 *  - Target ~1000 characters per chunk (~250 tokens)
 *  - 200 char overlap so context spans chunk boundaries
 *  - Prefer breaking on paragraph / sentence boundaries
 */
export function chunkText(
  text: string,
  opts: { chunkSize?: number; overlap?: number } = {},
): string[] {
  const chunkSize = opts.chunkSize ?? 1000;
  const overlap = opts.overlap ?? 200;

  // Normalize whitespace
  const cleaned = text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  if (cleaned.length === 0) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + chunkSize, cleaned.length);

    // If we're not at the end of the document, try to break at a sentence/paragraph boundary
    if (end < cleaned.length) {
      const slice = cleaned.slice(start, end);
      // Look for the last paragraph break or sentence end
      const breakPoints = [
        slice.lastIndexOf("\n\n"),
        slice.lastIndexOf(". "),
        slice.lastIndexOf("? "),
        slice.lastIndexOf("! "),
        slice.lastIndexOf("\n"),
      ];
      const bestBreak = Math.max(...breakPoints);
      if (bestBreak > chunkSize * 0.5) {
        end = start + bestBreak + 1;
      }
    }

    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length > 0) chunks.push(chunk);

    if (end >= cleaned.length) break;
    start = end - overlap;
  }

  return chunks;
}

/**
 * Generate embeddings for a list of text chunks in a single batched call.
 * OpenAI's embedding API accepts up to 2048 inputs per request.
 */
export async function embedChunks(chunks: string[]): Promise<number[][]> {
  if (chunks.length === 0) return [];

  // Batch in groups of 96 to stay well under request size limits
  const batchSize = 96;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const res = await getOpenAI().embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });
    for (const item of res.data) {
      allEmbeddings.push(item.embedding);
    }
  }

  return allEmbeddings;
}

/**
 * Embed a single query string (for vector search at chat time).
 */
export async function embedQuery(query: string): Promise<number[]> {
  const res = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
  });
  return res.data[0].embedding;
}
