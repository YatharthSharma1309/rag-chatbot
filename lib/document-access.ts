import { getSupabaseAdmin } from "@/lib/supabase";

export async function assertDocumentOwnedByUser(
  documentId: string,
  userId: string,
): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("documents").select("user_id").eq("id", documentId).maybeSingle();

  if (error) throw error;
  if (!data || data.user_id !== userId) {
    const err = new Error("Document not found or access denied");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
}
