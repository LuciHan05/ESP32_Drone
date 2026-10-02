import Image from "next/image";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DroneIllustration } from "@/components/drone-illustration";
import { Icon } from "@/components/icons";
import { Timeline } from "@/components/timeline";
import { project, software } from "@/data/project";
import { getPublicContent } from "@/lib/server/content";

export const revalidate = 300;

export default async function Home() {
  const content = await getPublicContent();
  const hardware = content.components;
  const steps = content.steps;
  const heroMedia = content.gallery.find(image => image.id === content.heroImageId) ?? project.heroMedia;
  return <>
    <Header />
    <main id="continut">
      <section id="acasa" className="hero container" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow"><span className="tiny-cross">+</span> PROIECT PERSONAL / INGINERIE & COD</div>
          <h1 id="hero-title"><span>Esp32 Drone</span></h1>
          <p className="hero-description">{project.description}</p>
          <div className="hero-actions"><a className="button button-orange" href="#jurnal">Explorează construcția <Icon name="arrow" /></a><a className="text-link" href="#proiect">Despre proiect <Icon name="diagonal" width="16" height="16" /></a></div>
          <div className="hero-note"><span className="status-dot" /><span>Prototip funcțional <span className="note-separator">/</span> Testare & reglaje</span></div>
        </div>
        <figure className="hero-visual">
          <div className="visual-top mono"><span><span className="orange-square" /> {project.name} / QUAD X</span><span>REV. 01</span></div>
          <div className="hero-media">
            {project.heroVideo ? <video controls preload="none" playsInline poster={heroMedia?.src} aria-label="Prezentarea video a dronei"><source src={project.heroVideo} type="video/mp4" />Browserul tău nu suportă video HTML5.</video> : heroMedia ? <Image src={heroMedia.src} alt={heroMedia.alt} fill sizes="(min-width: 1024px) 52vw, 100vw" preload className="object-cover" /> : <DroneIllustration />}
          </div>
          <figcaption className="visual-bottom"><span className="mono">{heroMedia || project.heroVideo ? "01 / PROIECTUL REAL" : "01 / CONCEPT TEHNIC"}</span><span>{heroMedia || project.heroVideo ? "De la componente la sistem." : "Schemă ilustrativă · fotografie în curând"}</span><span aria-hidden="true">↗</span></figcaption>
        </figure>
      </section>

      <div className="container"><dl className="spec-strip">
        {[{value:"ESP32", label:"CONTROLER DE ZBOR", sub:"Creierul proiectului"},{value:"6 axe", label:"SENZOR MPU6050", sub:"Orientare & mișcare"},{value:"4 motoare", label:"CONFIGURAȚIE QUAD X", sub:"Mecanică în echilibru"},{value:"ESP-NOW", label:"CONTROL WIRELESS", sub:"Telecomandă → dronă"}].map(item => <div key={item.label}><dt className="eyebrow">{item.label}</dt><dd>{item.value}<span>{item.sub}</span></dd></div>)}
      </dl></div>

      <nav className="container project-directory" aria-label="Explorează proiectul">{[
        {href:"/componente", number:"01", title:"Componente", description:"Piese, specificații și fotografii", icon:"chip" as const},
        {href:"/constructie", number:"02", title:"Construcție", description:"Etapele și provocările proiectului", icon:"drone" as const},
        {href:"/cod", number:"03", title:"Cod & firmware", description:"Fișiere, explicații și resurse", icon:"code" as const},
        {href:"/galerie", number:"04", title:"Galerie", description:"Din atelier, în imagini", icon:"image" as const},
      ].map(item => <a key={item.href} href={item.href}><div><span className="mono">{item.number}</span><Icon name={item.icon} /></div><h2>{item.title}</h2><p>{item.description}</p><Icon name="diagonal" className="directory-arrow" /></a>)}</nav>

      <section id="proiect" className="container overview section-space" aria-labelledby="overview-title">
        <div><p className="section-label"><span>01</span> DESPRE PROIECT</p><h2 id="overview-title">Sistem construit de la zero.</h2></div>
        <div className="overview-copy"><p className="lead">Cum transformi câteva componente și multe linii de cod într-un sistem care se poate ridica de la sol?</p><p>Acesta este jurnalul meu de răspunsuri, teste și iterații. Am construit un quadcopter în jurul unui ESP32, cu citirea senzorilor, comunicația wireless și stabilizarea implementate în firmware propriu.</p><div className="tags"><span>Embedded systems</span><span>Electronică</span><span>Control automat</span><span>DIY</span></div></div>
      </section>

      <section id="specificatii" className="specs-section" aria-labelledby="specs-title"><div className="container section-space">
        <div className="section-heading"><div><p className="section-label"><span>02</span> SUB CAPOTĂ</p><h2 id="specs-title">Componente. Conexiuni. Cod.</h2></div><p>Două părți ale aceluiași sistem.<br />Fiecare cu un rol bine definit.</p></div>
        <div className="specs-grid">{[{title:"Hardware", subtitle:"Structura fizică", icon:"chip" as const, items:hardware},{title:"Software", subtitle:"Logica din spatele zborului", icon:"code" as const, items:software}].map(group => <article className="spec-panel" key={group.title}><div className="spec-panel-heading"><span className="spec-icon"><Icon name={group.icon} width="23" height="23" /></span><div><h3>{group.title}</h3><span>{group.subtitle}</span></div><span className="mono spec-count">{String(group.items.length).padStart(2,"0")} ELEMENTE</span></div><dl>{group.items.map(item => <div className="spec-row" key={item.name}><dt>{item.name}</dt><dd>{item.value}<span>{item.detail}</span></dd></div>)}</dl></article>)}</div>
        <div className="section-links"><a className="text-link" href="/componente">Vezi toate componentele și fotografiile <Icon name="diagonal" /></a><a className="text-link" href="/cod">Explorează codul dronei <Icon name="diagonal" /></a></div>
        <div className="signal-flow"><span className="eyebrow">DE LA COMANDĂ LA MIȘCARE</span><ol>{["Telecomandă", "ESP-NOW", "ESP32 + PID", "ESC-uri", "Motoare"].map((label,index) => <li key={label}>{index > 0 && <Icon name="arrow" width="16" height="16" />}<span>{label}</span></li>)}</ol></div>
      </div></section>

      <section id="jurnal" className="container section-space journal" aria-labelledby="journal-title">
        <div className="section-heading"><div><p className="section-label"><span>03</span> JURNAL DE CONSTRUCȚIE</p><h2 id="journal-title">Pașii parcurși până la zbor</h2></div><div className="journal-count"><strong className="mono">{String(steps.length).padStart(2,"0")}</strong><span>etape de urmărit<br />de la cadru la cameră</span></div></div>
        <p className="journal-intro">Deciziile, provocările și ce am învățat pe parcurs. Deschide fiecare etapă pentru detalii.</p>
        <Timeline steps={steps.slice(0, 2)} />
        <a className="button button-dark journal-more" href="/constructie">Vezi jurnalul complet <Icon name="arrow" /></a>
      </section>
    </main>
    <Footer />
  </>;
}
