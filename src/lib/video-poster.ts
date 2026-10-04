const CACHE_PREFIX = "drone-video-poster-v1:";
const MAX_EDGE = 640;

/** Decode a still frame without playing audio or changing the visible player's position. */
export function createVideoPoster(src: string, signal: AbortSignal): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException("Anulat", "AbortError")); return; }
    const media = document.createElement("video");
    media.crossOrigin = "anonymous";
    media.muted = true;
    media.playsInline = true;
    media.preload = "auto";
    let settled = false;
    let capturing = false;
    let readyToCapture = false;
    const timeout = window.setTimeout(() => finish(new Error("Miniatura nu a putut fi generată.")), 15000);

    function finish(error?: Error, blob?: Blob) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      signal.removeEventListener("abort", cancel);
      media.onloadedmetadata = media.onloadeddata = media.onseeked = media.onerror = null;
      media.removeAttribute("src");
      media.load();
      if (blob) resolve(blob); else reject(error ?? new Error("Miniatura nu a putut fi generată."));
    }
    function cancel() { finish(new DOMException("Anulat", "AbortError")); }
    function capture() {
      if (settled || capturing || !readyToCapture || media.seeking || media.readyState < 2) return;
      capturing = true;
      try {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, MAX_EDGE / Math.max(media.videoWidth, media.videoHeight));
        canvas.width = Math.max(1, Math.round(media.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(media.videoHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Browserul nu poate crea miniatura.");
        context.drawImage(media, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => finish(undefined, blob ?? undefined), "image/webp", 0.8);
      } catch { finish(new Error("Miniatura nu a putut fi generată.")); }
    }

    signal.addEventListener("abort", cancel, { once: true });
    media.onerror = () => finish(new Error("Filmarea nu poate fi citită pentru miniatură."));
    media.onloadedmetadata = () => {
      if (!media.videoWidth || !media.videoHeight || Number.isNaN(media.duration) || media.duration <= 0) {
        finish(new Error("Filmarea nu are un cadru disponibil."));
        return;
      }
      // Skip fade-in frames. WebM can report Infinity until the whole file is indexed.
      media.currentTime = Math.min(2, media.duration / 2);
    };
    media.onseeked = () => { readyToCapture = true; capture(); };
    media.onloadeddata = capture;
    media.src = src;
    media.load();
  });
}

/** Legacy videos get a small, tab-cached poster until an administrator publishes one. */
export async function getVideoPoster(src: string, signal: AbortSignal): Promise<string> {
  const key = CACHE_PREFIX + src;
  try {
    const cached = sessionStorage.getItem(key);
    if (cached && /^data:image\/(webp|png);base64,/.test(cached)) return cached;
  } catch { /* Preview generation also works when browser storage is disabled. */ }
  const blob = await createVideoPoster(src, signal);
  const result = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Miniatura nu poate fi citită."));
    reader.readAsDataURL(blob);
  });
  if (signal.aborted) throw new DOMException("Anulat", "AbortError");
  try { sessionStorage.setItem(key, result); } catch { /* A full cache must not block playback. */ }
  return result;
}
