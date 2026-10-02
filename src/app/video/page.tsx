import type { Metadata } from "next";
import { PublicPage } from "@/components/public-page";
import { VideoPlayer } from "@/components/video-player";
import { Icon } from "@/components/icons";
import { getPublicContent } from "@/lib/server/content";

export const metadata: Metadata = { title: "Video — ESP32_DRONE", description: "Filmări cu pilotarea și testele dronei ESP32." };
export const revalidate = 300;

export default async function VideoPage() {
  const { videos } = await getPublicContent();
  return <PublicPage active="/video" number="05" eyebrow="VIDEO / TESTE DE ZBOR" title="Drona în zbor." description="Filmări cu pilotarea dronei și testele din timpul proiectului. Alege o filmare și apasă Play.">
    <div className="collection-meta"><span>{videos.length === 1 ? "1 filmare publicată" : `${videos.length} filmări publicate`}</span><span className="mono">ESP32 / ÎN ZBOR</span></div>
    {videos.length ? <div className="video-collection">{videos.map((video, index) => <article className="video-card" key={video.id}>
      <div className="video-heading"><span className="eyebrow">FILMAREA {String(index + 1).padStart(2, "0")}</span><h2>{video.title}</h2></div>
      <VideoPlayer video={video} />
      {video.description && <p className="video-description">{video.description}</p>}
    </article>)}</div> : <div className="collection-empty"><Icon name="drone" width="40" height="40" /><h2>Filmări în curând.</h2><p>Aici vor apărea videoclipurile cu pilotarea dronei.</p><a className="text-link" href="/galerie">Vezi fotografiile <Icon name="arrow" /></a></div>}
  </PublicPage>;
}
