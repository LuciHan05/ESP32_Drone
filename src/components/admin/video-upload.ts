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
      headers: { apikey: ticket.apiKey, "x-signature": ticket.token },
      chunkSize: 6 * 1024 * 1024,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      uploadDataDuringCreation: true,
      storeFingerprintForResuming: false,
      metadata: { bucketName: VIDEO_BUCKET, objectName: ticket.path, contentType: file.type, cacheControl: "31536000" },
      onProgress: (sent, total) => onProgress(Math.min(99, Math.floor(sent / total * 100))),
      // Report only an HTTP status, never provider text/URLs containing tokens.
      onError: (error) => {
        const status = "originalResponse" in error ? error.originalResponse?.getStatus() : undefined;
        const reason = status === 401 || status === 403
          ? "Supabase a refuzat autorizarea transferului. Reîncarcă pagina și selectează din nou filmarea."
          : status === 413
            ? "Supabase a refuzat dimensiunea fișierului. Verifică limita proiectului și a spațiului drone-videos."
            : status === 415
              ? "Supabase nu acceptă formatul filmării. Folosește MP4 sau WebM."
              : status === 429
                ? "Sunt prea multe cereri. Așteaptă puțin și selectează din nou filmarea."
                : "Încărcarea nu s-a finalizat. Verifică conexiunea și selectează din nou filmarea.";
        finish(new Error(`${reason}${status ? ` (HTTP ${status})` : ""}`));
      },
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
