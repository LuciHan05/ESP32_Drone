"use client";

import Image from "next/image";
import { useId } from "react";
import type { GalleryImage } from "@/lib/content-types";

type ImagesEditorProps = {
  images: GalleryImage[];
  label: string;
  disabled: boolean;
  heroImageId?: string | null;
  onHeroChange?: (id: string | null) => void;
  onChange: (images: GalleryImage[]) => void;
  onUpload: (files: File[]) => void;
};

export function ImagesEditor({ images, label, disabled, heroImageId, onHeroChange, onChange, onUpload }: ImagesEditorProps) {
  const id = useId();
  function updateImage(imageId: string, changes: Partial<GalleryImage>) {
    onChange(images.map((image) => image.id === imageId ? { ...image, ...changes } : image));
  }

  return (
    <section className="admin-images" aria-label={label}>
      <div className="admin-upload-area">
        <div>
          <strong>{label}</strong>
          <p>JPEG, PNG sau WebP · maximum 20 MB/fotografie · până la 8 simultan. Optimizarea se face automat înainte de încărcare.</p>
        </div>
        <label className={`admin-button admin-upload-button${disabled ? " is-disabled" : ""}`} htmlFor={id}>
          <span aria-hidden="true">＋</span> Adaugă fotografii
          <input id={id} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={disabled}
            onChange={(event) => {
              const files = Array.from(event.currentTarget.files ?? []);
              event.currentTarget.value = "";
              if (files.length) onUpload(files);
            }} />
        </label>
      </div>
      {images.length === 0 && <div className="admin-empty-images"><span aria-hidden="true">＋</span><p>Fotografiile tale vor apărea aici.</p><small>Vor deveni vizibile pe site după publicare.</small></div>}
      <div className="admin-image-grid">
        {images.map((image, index) => (
          <article className="admin-image-card" key={image.id}>
            <div className="admin-image-preview"><Image src={image.src} alt={image.alt || `Fotografie ${index + 1}`} width={640} height={480} unoptimized /></div>
            <div className="admin-image-fields">
              <label className="admin-field"><span>Descriere accesibilă (alt)</span><input value={image.alt} maxLength={300} disabled={disabled} placeholder="Ex.: Cadru de dronă cu patru motoare" onChange={(event) => updateImage(image.id, { alt: event.target.value })} /></label>
              <label className="admin-field"><span>Legendă fotografie</span><input value={image.caption} maxLength={500} disabled={disabled} placeholder="Detalii vizibile sub fotografie" onChange={(event) => updateImage(image.id, { caption: event.target.value })} /></label>
              {onHeroChange && <label className="admin-check"><input type="radio" name="hero-image" checked={heroImageId === image.id} disabled={disabled} onChange={() => onHeroChange(image.id)} /><span>Imagine principală pe site</span></label>}
              <button className="admin-button admin-button-danger" type="button" disabled={disabled} onClick={() => {
                if (window.confirm("Elimini fotografia din această secțiune? Schimbarea devine publică după salvare.")) onChange(images.filter((item) => item.id !== image.id));
              }}>Elimină fotografia</button>
            </div>
          </article>
        ))}
      </div>
      {onHeroChange && heroImageId && <button className="admin-button admin-button-quiet" type="button" disabled={disabled} onClick={() => onHeroChange(null)}>Folosește ilustrația inițială pentru copertă</button>}
    </section>
  );
}
