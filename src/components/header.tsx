import { project } from "@/data/project";
import Link from "next/link";
import { Icon } from "./icons";
import { MobileMenu } from "./mobile-menu";

const links = [{ href: "/", label: "Prezentare" }, { href: "/componente", label: "Componente" }, { href: "/constructie", label: "Construcție" }, { href: "/cod", label: "Cod" }, { href: "/galerie", label: "Galerie" }, { href: "/video", label: "Video" }];

export function Header({ active = "/" }: { active?: string }) {
  return <header className="site-header">
    <div className="container header-inner">
      <Link className="wordmark" href="/" aria-label={`${project.name} — pagina principală`}><span className="brand-icon"><Icon name="drone" /></span>{project.name}<span className="brand-dot">.</span></Link>
      <nav className="desktop-nav" aria-label="Navigare principală">{links.map(link => <a key={link.href} href={link.href} aria-current={active === link.href ? "page" : undefined}>{link.label}</a>)}</nav>
      <a className="header-github" href={project.githubUrl} target="_blank" rel="noreferrer">GitHub <Icon name="diagonal" width="16" height="16" /><span className="sr-only"> (se deschide într-o filă nouă)</span></a>
      <MobileMenu links={links} active={active} />
    </div>
  </header>;
}
