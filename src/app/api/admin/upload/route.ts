import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/server/auth";
import { IMAGE_BUCKET } from "@/lib/server/config";
import { ApiError, apiFailure, assertSameOrigin, privateJson } from "@/lib/server/http";
import { normalizeImage, readUpload } from "@/lib/server/image-upload";
import type { GalleryImage } from "@/lib/content-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    // Authenticate before reading or decoding any uploaded bytes.
    const { client, user } = await requireAdmin();
    const { file, bytes } = await readUpload(request);
    const normalized = await normalizeImage(bytes);
    const id = randomUUID();
    const path = `${user.id}/${id}.webp`;
    const { error } = await client.storage.from(IMAGE_BUCKET).upload(path, normalized, {
      contentType: "image/webp", cacheControl: "31536000", upsert: false,
    });
    if (error) throw new ApiError(503, "Imaginea nu a putut fi încărcată. Verifică spațiul disponibil și politicile Storage.");
    const { data } = client.storage.from(IMAGE_BUCKET).getPublicUrl(path);
    const image: GalleryImage = {
      id, src: data.publicUrl,
      alt: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/[\x00-\x1F\x7F]/g, "").slice(0, 160),
      caption: "",
    };
    return privateJson(image, 201);
  } catch (error) { return apiFailure(error); }
}
