export const VIDEO_BUCKET = "drone-videos";
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_VIDEOS = 12;

/** Signed TUS uploads have a separate route from bearer-authenticated uploads. */
export function getSignedVideoUploadEndpoint(supabaseUrl: string): string {
  const origin = new URL(supabaseUrl);
  if (/^[a-z0-9]+\.supabase\.co$/.test(origin.hostname)) {
    origin.hostname = origin.hostname.replace(".supabase.co", ".storage.supabase.co");
  }
  return `${origin.origin}/storage/v1/upload/resumable/sign`;
}

export function videoExtension(mimeType: string): "mp4" | "webm" | null {
  return mimeType === "video/mp4" ? "mp4" : mimeType === "video/webm" ? "webm" : null;
}

export function validateVideoFile(file: { name: string; type: string; size: number }) {
  const extension = videoExtension(file.type);
  if (!extension || !file.name.toLowerCase().endsWith(`.${extension}`)) {
    throw new Error("Alege un fișier MP4 sau WebM. Pentru compatibilitate, exportă MP4 cu video H.264 și audio AAC.");
  }
  if (!Number.isSafeInteger(file.size) || file.size <= 0 || file.size > MAX_VIDEO_BYTES) {
    throw new Error("Filmarea trebuie să aibă maximum 50 MB. Exportă o versiune mai scurtă sau comprimată.");
  }
  return extension;
}

export function isSafeVideoSource(value: string, supabaseUrl?: string): boolean {
  if (!supabaseUrl || value.includes("%") || value.includes("\\") || value.split("/").some(part => part === "." || part === "..")) return false;
  try {
    const url = new URL(value);
    const prefix = `/storage/v1/object/public/${VIDEO_BUCKET}/`;
    return url.protocol === "https:" && url.origin === new URL(supabaseUrl).origin &&
      !url.username && !url.password && !url.search && !url.hash && url.pathname.startsWith(prefix) &&
      /^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(mp4|webm)$/.test(url.pathname.slice(prefix.length));
  } catch { return false; }
}
