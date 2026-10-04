"use client";

import { useEffect, useRef, useState } from "react";
import type { DroneVideo } from "@/lib/content-types";
import { getVideoPoster } from "@/lib/video-poster";

export function VideoPlayer({ video }: { video: DroneVideo }) {
  const [failed, setFailed] = useState(false);
  const [generatedPoster, setGeneratedPoster] = useState<string>();
  const mediaRef = useRef<HTMLVideoElement>(null);
  const previewAbort = useRef<AbortController | null>(null);
  const poster = video.posterSrc || generatedPoster;

  useEffect(() => {
    const media = mediaRef.current;
    if (!media || video.posterSrc) return;
    const controller = new AbortController();
    previewAbort.current = controller;
    const generate = () => {
      void getVideoPoster(video.src, controller.signal).then(image => {
        if (!controller.signal.aborted) setGeneratedPoster(image);
      }).catch(() => { /* A missing preview must never prevent playing the video. */ });
    };
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        generate();
      }
    }, { rootMargin: "200px" });
    observer.observe(media);
    return () => { observer.disconnect(); controller.abort(); };
  }, [video.src, video.posterSrc]);

  return <div className="video-player">
    <video ref={mediaRef} controls playsInline preload="none" poster={poster} aria-label={video.title}
      onPlay={() => previewAbort.current?.abort()} onError={() => setFailed(true)}>
      <source src={video.src} type={video.mimeType} onError={() => setFailed(true)} />
      Browserul tău nu suportă redarea video.
    </video>
    {failed && <p className="video-error" role="status">Filmarea nu poate fi redată în acest browser. <a href={video.src} target="_blank" rel="noreferrer">Deschide fișierul video într-o filă nouă</a>.</p>}
  </div>;
}
