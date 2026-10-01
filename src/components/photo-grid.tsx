import Image from "next/image";
import type { GalleryImage } from "@/lib/content-types";

export function PhotoGrid({ images, compact = false }: { images: GalleryImage[]; compact?: boolean }) {
  if (!images.length) return null;
  return <div className={`photo-grid ${compact ? "photo-grid-compact" : ""}`}>
    {images.map((image) => <figure key={image.id} className="gallery-photo">
      <a href={image.src} target="_blank" rel="noreferrer" className="gallery-photo-link" aria-label={`Deschide fotografia: ${image.alt} (filă nouă)`}>
        <Image src={image.src} alt={image.alt} fill sizes={compact ? "(min-width: 768px) 25vw, 45vw" : "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"} className="object-cover" />
        <span className="photo-expand" aria-hidden="true">↗</span>
      </a>
      {image.caption && <figcaption>{image.caption}</figcaption>}
    </figure>)}
  </div>;
}
