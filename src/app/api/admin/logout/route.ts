import { apiFailure, assertSameOrigin, privateJson } from "@/lib/server/http";
import { createAdminClient } from "@/lib/server/supabase";
import { isSupabaseConfigured } from "@/lib/server/config";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    if (isSupabaseConfigured()) {
      const client = await createAdminClient();
      await client.auth.signOut({ scope: "local" });
    }
    return privateJson({ ok: true });
  } catch (error) { return apiFailure(error); }
}
