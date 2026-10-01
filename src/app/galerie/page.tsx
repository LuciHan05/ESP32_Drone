import type { Metadata } from "next";
import { PublicPage } from "@/components/public-page";
import { PhotoGrid } from "@/components/photo-grid";
import { Icon } from "@/components/icons";
import { getPublicContent } from "@/lib/server/content";

export const metadata: Metadata = { title: "Galerie foto — ESP32_DRONE", description: "Fotografii cu drona, componentele și etapele de construcție." };
export const revalidate = 300;

export default async function GalleryPage() {
  const content = await getPublicContent();
  const groups = [
    { id: "drona", title: "Drona", description: "Ansamblul și testele în imagini.", images: content.gallery },
    ...content.components.filter(c => c.images.length).map(c => ({id:`componenta-${c.id}`,title:c.value,description:c.name,images:c.images})),
    ...content.steps.filter(s => s.images.length).map(s => ({id:`etapa-${s.id}`,title:s.title,description:s.category,images:s.images})),
  ].filter(g => g.images.length);
  const total = groups.reduce((n, g) => n + g.images.length, 0);
  return <PublicPage active="/galerie" number="04" eyebrow="GALERIE / DIN ATELIER" title="Povestea proiectului, în imagini." description="Drona, componentele și etapele de construcție. Selectează o fotografie pentru a o vedea la dimensiunea completă.">
    <div className="collection-meta"><span>{total} fotografii publicate</span><span className="mono">DIN ATELIER → ÎN AER</span></div>
    {groups.length ? groups.map(group => <section className="gallery-group" key={group.id} aria-labelledby={`galerie-${group.id}`}><span className="eyebrow">{group.description}</span><h2 id={`galerie-${group.id}`}>{group.title}</h2><PhotoGrid images={group.images} /></section>) : <div className="collection-empty gallery-empty"><Icon name="image" width="40" height="40" /><h2>Locul fotografiilor din atelier.</h2><p>Primele imagini cu drona, componentele și construcția vor apărea aici.</p><a className="text-link" href="/constructie">Până atunci, explorează jurnalul <Icon name="arrow" /></a></div>}
  </PublicPage>;
}
