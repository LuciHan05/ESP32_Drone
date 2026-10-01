import type { Metadata } from "next";
import { PublicPage } from "@/components/public-page";
import { Timeline } from "@/components/timeline";
import { getPublicContent } from "@/lib/server/content";

export const metadata: Metadata = { title: "Etape de construcție — ESP32_DRONE", description: "Jurnalul de construcție al dronei: fotografii, scheme, provocări și rezultate, pas cu pas." };
export const revalidate = 300;

export default async function ConstructionPage() {
  const { steps } = await getPublicContent();
  return <PublicPage active="/constructie" number="02" eyebrow="JURNAL DE CONSTRUCȚIE" title="De la primele piese la primul zbor." description="Fiecare etapă are propriile fotografii, explicații și provocări. Deschide documentația pentru a urmări deciziile din spatele construcției.">
    <div className="collection-meta"><span>{steps.length} etape în jurnal</span><span className="mono">CONSTRUIRE → TESTARE → ITERAȚIE</span></div>
    {steps.length ? <Timeline steps={steps} /> : <div className="collection-empty"><h2>Jurnalul este în pregătire.</h2><p>Etapele vor apărea aici după publicare.</p></div>}
  </PublicPage>;
}
