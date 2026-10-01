import type { Metadata } from "next";
import { PublicPage } from "@/components/public-page";
import { PhotoGrid } from "@/components/photo-grid";
import { Icon } from "@/components/icons";
import { getPublicContent } from "@/lib/server/content";

export const metadata: Metadata = { title: "Componente — ESP32_DRONE", description: "Componentele dronei: controler, senzori, propulsie, alimentare și fotografiile montajului." };
export const revalidate = 300;

export default async function ComponentsPage() {
  const { components } = await getPublicContent();
  return <PublicPage active="/componente" number="01" eyebrow="HARDWARE / INVENTAR" title="Fiecare piesă are un rol." description="Componentele proiectului, alegerile tehnice și fotografiile lor, într-un singur loc.">
    <div className="collection-meta"><span>{components.length} componente documentate</span><span className="mono">ESP32 / QUAD X</span></div>
    {components.length ? <div className="component-collection">{components.map((item, index) => <article className="component-card" key={item.id} id={`componenta-${item.id}`}>
      <div className="component-card-top"><span className="mono">{String(index + 1).padStart(2, "0")}</span><span className={`status ${item.confirmed ? "status-documented" : "status-planned"}`}><span />{item.confirmed ? "În proiect" : "De documentat / planificat"}</span></div>
      <div className="component-card-content"><span className="eyebrow">{item.name}</span><h2>{item.value}</h2><p>{item.detail}</p></div>
      {item.images.length ? <PhotoGrid images={item.images} compact /> : <div className="component-photo-placeholder"><Icon name="image" width="26" height="26" /><span>Fotografii în curând</span></div>}
    </article>)}</div> : <div className="collection-empty"><Icon name="chip" /><h2>Inventarul este în pregătire.</h2><p>Componentele vor apărea aici după publicare.</p></div>}
  </PublicPage>;
}
