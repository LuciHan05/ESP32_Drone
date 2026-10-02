"use client";

import { useState } from "react";
import type { DroneVideo } from "@/lib/content-types";

export function VideoPlayer({ video }: { video: DroneVideo }) {
  const [failed, setFailed] = useState(false);
  return <div className="video-player">
    <video controls playsInline preload="none" aria-label={video.title} onError={() => setFailed(true)}>
      <source src={video.src} type={video.mimeType} onError={() => setFailed(true)} />
      Browserul tău nu suportă redarea video.
    </video>
    {failed && <p className="video-error" role="status">Filmarea nu poate fi redată în acest browser. <a href={video.src} target="_blank" rel="noreferrer">Deschide fișierul video într-o filă nouă</a>.</p>}
  </div>;
}
