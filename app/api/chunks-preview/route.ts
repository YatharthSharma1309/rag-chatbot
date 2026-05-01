import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-api";
import { assertDocumentOwnedByUser } from "@/lib/document-access";
import { matchChunksForDocumentQuery } from "@/lib/rag-context";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/chunks-preview
 *
 * Signed-in users only; document must belong to the caller.
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { documentId?: string; query?: string };
    const documentId = typeof body.documentId === "string" ? body.documentId.trim() : "";
    const query = typeof body.query === "string" ? body.query.trim() : "";

    if (!documentId) {
      return NextResponse.json({ error: "documentId required" }, { status: 400 });
    }
    if (!query) {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }
    if (query.length > 4000) {
      return NextResponse.json({ error: "query too long (max 4000 chars)" }, { status: 400 });
    }

    try {
      await assertDocumentOwnedByUser(documentId, userId);
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const chunks = await matchChunksForDocumentQuery(query, documentId);
    return NextResponse.json({ chunks });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    console.error("[/api/chunks-preview]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
