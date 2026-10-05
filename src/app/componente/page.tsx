import type { Metadata } from "next";
import { PublicPage } from "@/components/public-page";
import { ComponentCollection } from "@/components/component-collection";
import { getPublicContent } from "@/lib/server/content";

export const metadata: Metadata = { title: "Componente — ESP32_DRONE", description: "Componentele dronei: controler, senzori, propulsie, alimentare și fotografiile montajului." };
export const revalidate = 300;

export default async function ComponentsPage() {
  const { components } = await getPublicContent();
  return <PublicPage active="/componente" number="01" eyebrow="HARDWARE / INVENTAR" title="Fiecare piesă are un rol." description="Componentele proiectului, alegerile tehnice și fotografiile lor, într-un singur loc.">
    <div className="collection-meta"><span>{components.length} componente documentate</span><span className="mono">ESP32 / QUAD X</span></div>
    <ComponentCollection components={components} />
  </PublicPage>;
}
