import type { DroneComponent } from "@/lib/content-types";
import { PhotoGrid } from "./photo-grid";
import { Icon } from "./icons";

export function ComponentCollection({ components, headingLevel = 2 }: {
  components: DroneComponent[];
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  if (!components.length) return <div className="collection-empty"><Icon name="chip" /><Heading>Inventarul este în pregătire.</Heading><p>Componentele vor apărea aici după publicare.</p></div>;

  return <div className="component-collection">{components.map((item, index) => <article className="component-card" key={item.id} id={`componenta-${item.id}`}>
    <div className="component-card-top"><span className="mono">{String(index + 1).padStart(2, "0")}</span><span className={`status ${item.confirmed ? "status-documented" : "status-planned"}`}><span />{item.confirmed ? "În proiect" : "De documentat / planificat"}</span></div>
    <div className="component-card-content"><span className="eyebrow">{item.name}</span><Heading>{item.value}</Heading><p>{item.detail}</p></div>
    {item.images.length ? <PhotoGrid images={item.images} compact /> : <div className="component-photo-placeholder"><Icon name="image" width="26" height="26" /><span>Fotografii în curând</span></div>}
  </article>)}</div>;
}
