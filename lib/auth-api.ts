import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";

export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = createRouteHandlerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
