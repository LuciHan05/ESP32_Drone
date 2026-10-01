import type { Metadata } from "next";
import { PublicPage } from "@/components/public-page";
import { CodeFile } from "@/components/code-file";
import { Icon } from "@/components/icons";
import { software } from "@/data/project";
import { getPublicContent } from "@/lib/server/content";

export const metadata: Metadata = { title: "Cod & firmware — ESP32_DRONE", description: "Arhitectura software a dronei și fișierele de cod publicate de autor." };
export const revalidate = 300;

export default async function CodePage() {
  const { codeFiles, firmwareUrl } = await getPublicContent();
  return <PublicPage active="/cod" number="03" eyebrow="SOFTWARE / FIRMWARE" title="Logica din spatele zborului." description="Comunicația, citirea senzorilor și controlul motoarelor. Aici sunt explicate modulele software și sunt publicate versiunile de cod.">
    <section aria-labelledby="architecture-title"><h2 id="architecture-title" className="subsection-title">Arhitectura software</h2><div className="software-collection">{software.map(item => <article key={item.name}><span className="eyebrow">{item.name}</span><h3>{item.value}</h3><p>{item.detail}</p></article>)}</div></section>
    {firmwareUrl && <a className="button button-orange firmware-link" href={firmwareUrl} target="_blank" rel="noreferrer">Vezi codul dronei <Icon name="diagonal" /><span className="sr-only"> (filă nouă)</span></a>}
    <section className="code-library" aria-labelledby="source-title"><div className="collection-meta"><h2 id="source-title">Fișiere de cod</h2><span className="mono">{codeFiles.length} FIȘIERE PUBLICATE</span></div>
      {codeFiles.length ? codeFiles.map(file => <CodeFile key={file.id} file={file} />) : <div className="collection-empty"><Icon name="code" width="32" height="32" /><h3>Firmware-ul va fi publicat aici.</h3><p>Versiunile de cod vor include descrieri și fișiere care pot fi citite, copiate sau descărcate.</p></div>}
    </section>
  </PublicPage>;
}
