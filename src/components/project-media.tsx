import Image from "next/image";
import type { ProjectMedia as Media } from "@/data/project";
import { Icon } from "./icons";

export function ProjectMedia({ media, caption, index }: { media?: Media; caption: string; index: number }) {
  return <figure className="step-figure">
    <div className="step-image">
      {media ? <Image src={media.src} alt={media.alt} fill sizes="(min-width: 1024px) 360px, (min-width: 768px) 40vw, 90vw" className="object-cover" /> : <div className="image-placeholder">
        <span className="image-cross top-4 left-4">+</span><span className="image-cross bottom-4 right-4">+</span>
        <Icon name="image" width="28" height="28" />
        <span>Imagine de etapă</span>
        <span className="mono text-xs">FIG. {String(index + 1).padStart(2, "0")}</span>
      </div>}
    </div>
    <figcaption><span className="mono">FIG. {String(index + 1).padStart(2, "0")}</span> {caption}</figcaption>
  </figure>;
}
