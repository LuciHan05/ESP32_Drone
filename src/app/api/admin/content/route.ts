import { ContentValidationError, parseContentSnapshot } from "@/lib/content-validation";
import { requireAdmin } from "@/lib/server/auth";
import { getSupabaseConfig } from "@/lib/server/config";
import { getContentSnapshot, saveContent } from "@/lib/server/content";
import { apiFailure, assertSameOrigin, privateJson, readJson } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { client } = await requireAdmin();
    return privateJson(await getContentSnapshot(client));
  } catch (error) { return apiFailure(error); }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const { client, user } = await requireAdmin();
    const snapshot = parseContentSnapshot(await readJson(request), getSupabaseConfig().url);
    return privateJson(await saveContent(client, snapshot, user.id));
  } catch (error) {
    if (error instanceof ContentValidationError) return privateJson({ error: error.message }, 400);
    return apiFailure(error);
  }
}
