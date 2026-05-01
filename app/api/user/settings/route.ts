import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { getSupabaseAdmin } from "@/lib/supabase";
import { encryptOpenRouterKey } from "@/lib/crypto-user-settings";
import { isValidOpenRouterModelId } from "@/lib/openrouter-models";
import { CHAT_MODEL } from "@/lib/openai";

export const runtime = "nodejs";

interface Body {
  preferredChatModel?: string;
  openrouterKey?: string | null;
  clearOpenrouterKey?: boolean;
}

/**
 * GET — current model + whether a key is stored (never returns the key).
 * POST — update model and/or replace/clear encrypted OpenRouter key.
 */
export async function GET() {
  try {
    const supabase = createRouteHandlerSupabaseClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("user_settings")
      .select("preferred_chat_model, encrypted_openrouter_key")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      preferredChatModel: data?.preferred_chat_model ?? CHAT_MODEL,
      hasOpenRouterKey: !!data?.encrypted_openrouter_key?.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    console.error("[GET /api/user/settings]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerSupabaseClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Body;
    const modelRaw =
      typeof body.preferredChatModel === "string" && body.preferredChatModel.trim()
        ? body.preferredChatModel.trim()
        : CHAT_MODEL;

    if (!isValidOpenRouterModelId(modelRaw)) {
      return NextResponse.json({ error: "Invalid model id format" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data: existing } = await admin
      .from("user_settings")
      .select("encrypted_openrouter_key")
      .eq("user_id", user.id)
      .maybeSingle();

    let encrypted: string | null = existing?.encrypted_openrouter_key ?? null;

    if (body.clearOpenrouterKey) {
      encrypted = null;
    } else if (typeof body.openrouterKey === "string" && body.openrouterKey.trim()) {
      const k = body.openrouterKey.trim();
      if (!k.startsWith("sk-or-")) {
        return NextResponse.json({ error: "OpenRouter keys usually start with sk-or-" }, { status: 400 });
      }
      encrypted = encryptOpenRouterKey(k);
    }

    const { error: upsertErr } = await admin.from("user_settings").upsert(
      {
        user_id: user.id,
        preferred_chat_model: modelRaw,
        encrypted_openrouter_key: encrypted,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (upsertErr) throw upsertErr;

    return NextResponse.json({
      ok: true,
      preferredChatModel: modelRaw,
      hasOpenRouterKey: !!encrypted?.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    console.error("[POST /api/user/settings]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
