import type { VideoUploadTicket } from "@/lib/content-types";
import { validateVideoFile, VIDEO_BUCKET } from "@/lib/video";

export async function checkVideo(file: File) {
  validateVideoFile(file);
  // Inspect a small header only; never decode/transcode a whole movie in memory.
  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const mp4 = bytes.length >= 12 && new TextDecoder().decode(bytes.slice(4, 8)) === "ftyp";
  const webm = bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  if (!(file.type === "video/mp4" ? mp4 : webm)) throw new Error("Fișierul nu pare un MP4/WebM valid. Exportă din nou filmarea.");
}

export async function uploadVideo(file: File, ticket: VideoUploadTicket, signal: AbortSignal, onProgress: (percent: number) => void): Promise<void> {
  // This library is loaded only when an administrator starts a video upload.
  const { Upload } = await import("tus-js-client");
  if (signal.aborted) throw new DOMException("Încărcare anulată", "AbortError");
  return new Promise((resolve, reject) => {
    const finish = (error?: Error) => { signal.removeEventListener("abort", cancel); if (error) reject(error); else resolve(); };
    const upload = new Upload(file, {
      endpoint: ticket.endpoint,
      headers: { "x-signature": ticket.token },
      chunkSize: 6 * 1024 * 1024,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      uploadDataDuringCreation: true,
      storeFingerprintForResuming: false,
      metadata: { bucketName: VIDEO_BUCKET, objectName: ticket.path, contentType: file.type, cacheControl: "31536000" },
      onProgress: (sent, total) => onProgress(Math.min(99, Math.floor(sent / total * 100))),
      // Do not surface provider messages that may contain the signed upload token.
      onError: () => finish(new Error("Încărcarea nu s-a finalizat. Verifică conexiunea, limita de 50 MB și spațiul Supabase, apoi selectează din nou filmarea.")),
      onSuccess: () => { onProgress(100); finish(); },
    });
    function cancel() {
      void upload.abort().catch(() => {});
      finish(new DOMException("Încărcare anulată", "AbortError"));
    }
    signal.addEventListener("abort", cancel, { once: true });
    upload.start();
  });
}
