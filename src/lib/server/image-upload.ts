import sharp from "sharp";
import { ApiError, readLimitedBody } from "./http";

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

function imageFormat(bytes: Buffer): "jpeg" | "png" | "webp" | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "png";
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "jpeg";
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export async function normalizeImage(bytes: Buffer): Promise<Buffer> {
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new ApiError(413, "Imaginea trebuie să aibă maximum 3 MB.");
  const format = imageFormat(bytes);
  if (!format) throw new ApiError(415, "Încarcă o imagine JPEG, PNG sau WebP validă.");
  try {
    const input = sharp(bytes, { limitInputPixels: 16_000_000, failOn: "warning", sequentialRead: true });
    const metadata = await input.metadata();
    if (metadata.format !== format || !metadata.width || !metadata.height ||
      metadata.width > 8192 || metadata.height > 8192 || (metadata.pages ?? 1) > 1) {
      throw new ApiError(415, "Imaginea trebuie să fie statică și să aibă maximum 8192 px pe latură / 16 megapixeli.");
    }
    // Decode and encode actual pixels. EXIF, embedded scripts and other metadata are discarded.
    const result = await input.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 }).toBuffer();
    if (result.length > MAX_IMAGE_BYTES) throw new ApiError(413, "Imaginea comprimată depășește 3 MB. Alege o imagine mai mică.");
    return result;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(415, "Imaginea nu poate fi decodată sau depășește limita de 16 megapixeli.");
  }
}

export async function readUpload(request: Request): Promise<{ file: File; bytes: Buffer }> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.startsWith("multipart/form-data;")) throw new ApiError(415, "Este necesară o încărcare multipart.");
  const body = await readLimitedBody(request, MAX_IMAGE_BYTES + 64 * 1024);
  let data: FormData;
  try {
    data = await new Response(Buffer.from(body), { headers: { "content-type": contentType } }).formData();
  } catch {
    throw new ApiError(400, "Încărcare invalidă.");
  }
  const file = data.get("file");
  if (!(file instanceof File) || [...data.entries()].length !== 1) throw new ApiError(400, "Selectează o singură imagine.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new ApiError(415, "Sunt acceptate doar JPEG, PNG și WebP.");
  if (!file.size || file.size > MAX_IMAGE_BYTES) throw new ApiError(413, "Imaginea trebuie să aibă maximum 3 MB.");
  return { file, bytes: Buffer.from(await file.arrayBuffer()) };
}
