import { embedQuery } from "@/lib/embeddings";
import { getSupabaseAdmin } from "@/lib/supabase";

/** Must stay aligned with citations [#1]…[#n] in the model context */
export const RAG_MATCH_COUNT = 5;

export type MatchedChunk = {
  slot: number;
  chunk_index: number;
  content: string;
  similarity: number;
};

export async function matchChunksForDocumentQuery(
  query: string,
  documentId: string | null,
): Promise<MatchedChunk[]> {
  const queryEmbedding = await embedQuery(query);
  const supabase = getSupabaseAdmin();
  const { data: matches, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    match_count: RAG_MATCH_COUNT,
    filter_document_id: documentId ?? null,
  });

  if (error) throw error;
  if (!matches?.length) return [];

  return matches.map(
    (row: { chunk_index: number; content: string; similarity: number }, i: number) => ({
      slot: i + 1,
      chunk_index: row.chunk_index,
      content: row.content,
      similarity: row.similarity,
    }),
  );
}

export function buildContextBlockFromMatches(matches: MatchedChunk[]): string {
  if (matches.length === 0) {
    return "(no matching context found — answer from general knowledge but tell the user no document context was found)";
  }
  return matches
    .map(
      (m) =>
        `[#${m.slot}] (chunk ${m.chunk_index}, similarity ${m.similarity.toFixed(3)})\n${m.content}`,
    )
    .join("\n\n---\n\n");
}
