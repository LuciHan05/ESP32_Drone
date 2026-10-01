import { project } from "@/data/project";
import Link from "next/link";
import { Icon } from "./icons";

export function Footer() {
  return <footer id="contact" className="site-footer">
    <div className="container">
      <div className="footer-main">
        <div><span className="eyebrow">CONSTRUIT. TESTAT. DOCUMENTAT.</span><h2>Un proiect personal.<br /><span>O mulțime de lucruri învățate.</span></h2></div>
        <div className="footer-links">
          <a className="button button-dark" href={project.githubUrl} target="_blank" rel="noreferrer">Profilul meu GitHub <Icon name="diagonal" /><span className="sr-only"> (filă nouă)</span></a>
          {project.email && <a className="text-link" href={`mailto:${project.email}`}>Hai să vorbim <Icon name="mail" /></a>}
          {project.portfolioUrl && <a className="text-link" href={project.portfolioUrl}>Portofoliul meu <Icon name="diagonal" /></a>}
        </div>
      </div>
      <div className="footer-bottom"><Link className="wordmark" href="/">{project.name}<span className="brand-dot">.</span></Link><span>Un jurnal de inginerie de {project.author}.</span><a href="/admin">Administrare</a><a href="#continut">Înapoi sus ↑</a></div>
    </div>
  </footer>;
}
