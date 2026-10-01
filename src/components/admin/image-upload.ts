const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_ORIGINAL_BYTES = 20 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

/** Resize locally before transfer; the server independently validates and re-encodes. */
export async function prepareImage(file: File): Promise<File> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error(`${file.name}: folosește JPEG, PNG sau WebP. Pentru fotografii HEIC, exportă mai întâi în JPEG.`);
  }
  if (file.size > MAX_ORIGINAL_BYTES) {
    throw new Error(`${file.name}: fotografia originală poate avea maximum 20 MB.`);
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode().catch(() => { throw new Error(`${file.name}: fotografia nu poate fi citită.`); });
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40_000_000) {
      throw new Error(`${file.name}: exportă fotografia la o rezoluție mai mică (maximum 40 megapixeli).`);
    }
    const scale = Math.min(1, 1920 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Browserul nu poate pregăti fotografia. Încearcă un browser actualizat.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.86, 0.72, 0.56]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (blob && blob.size <= MAX_UPLOAD_BYTES) {
        const extension = blob.type === "image/webp" ? "webp" : "png";
        return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${extension}`, { type: blob.type });
      }
    }
    throw new Error(`${file.name}: fotografia rămâne prea mare. Redu dimensiunile și încearcă din nou (maximum 3 MB la încărcare).`);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
