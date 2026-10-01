import { project } from "@/data/project";
import { Icon } from "./icons";
import { MobileMenu } from "./mobile-menu";

const links = [{ href: "#proiect", label: "Proiectul" }, { href: "#specificatii", label: "Specificații" }, { href: "#jurnal", label: "Jurnal de construcție" }];

export function Header() {
  return <header className="site-header">
    <div className="container header-inner">
      <a className="wordmark" href="#acasa" aria-label={`${project.name} — începutul paginii`}><span className="brand-icon"><Icon name="drone" /></span>{project.name}<span className="brand-dot">.</span></a>
      <nav className="desktop-nav" aria-label="Navigare principală">{links.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}</nav>
      <a className="header-github" href={project.githubUrl} target="_blank" rel="noreferrer">GitHub <Icon name="diagonal" width="16" height="16" /><span className="sr-only"> (se deschide într-o filă nouă)</span></a>
      <MobileMenu links={links} />
    </div>
  </header>;
}
