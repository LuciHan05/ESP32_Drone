import { randomUUID } from "node:crypto";
import type { DroneVideo, VideoUploadTicket } from "@/lib/content-types";
import { validateVideoFile, VIDEO_BUCKET } from "@/lib/video";
import { requireAdmin } from "@/lib/server/auth";
import { getSupabaseConfig } from "@/lib/server/config";
import { ApiError, apiFailure, assertSameOrigin, privateJson, readJson } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { client, user } = await requireAdmin();
    const input = await readJson(request, 4096);
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new ApiError(400, "Selectează o filmare.");
    const { name, type, size } = input as Record<string, unknown>;
    if (typeof name !== "string" || name.length > 255 || typeof type !== "string" || typeof size !== "number") throw new ApiError(400, "Datele filmării sunt invalide.");
    let extension: string;
    try { extension = validateVideoFile({ name, type, size }); }
    catch (error) { throw new ApiError(400, (error as Error).message); }
    const id = randomUUID();
    const path = `${user.id}/${id}.${extension}`;
    const bucket = client.storage.from(VIDEO_BUCKET);
    // RLS still authorizes this INSERT using the owner's session. The browser gets
    // only a short-lived token for this random object, never the user's access token.
    const { data, error } = await bucket.createSignedUploadUrl(path, { upsert: false });
    if (error || !data) throw new ApiError(503, "Încărcarea video nu este disponibilă. Verifică activarea spațiului drone-videos în Supabase și politica de încărcare.");
    const origin = new URL(getSupabaseConfig().url);
    if (/^[a-z0-9]+\.supabase\.co$/.test(origin.hostname)) origin.hostname = origin.hostname.replace(".supabase.co", ".storage.supabase.co");
    const video: DroneVideo = { id, src: bucket.getPublicUrl(path).data.publicUrl,
      title: name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/[\x00-\x1f\x7f]/g, "").trim().slice(0, 200) || "Filmarea dronei",
      description: "", mimeType: type as DroneVideo["mimeType"] };
    const ticket: VideoUploadTicket = { endpoint: `${origin.origin}/storage/v1/upload/resumable`, token: data.token, path, video };
    return privateJson(ticket, 201);
  } catch (error) { return apiFailure(error); }
}
