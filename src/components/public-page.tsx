import { Header } from "./header";
import { Footer } from "./footer";
import Link from "next/link";

export function PublicPage({ active, number, eyebrow, title, description, children }: {
  active: string; number: string; eyebrow: string; title: string; description: string; children: React.ReactNode;
}) {
  return <><Header active={active} /><main id="continut" className="container collection-page">
    <div className="collection-intro"><Link href="/" className="collection-back">← Înapoi la proiect</Link><p className="section-label"><span>{number}</span>{eyebrow}</p><h1>{title}</h1><p className="collection-description">{description}</p></div>
    {children}
  </main><Footer /></>;
}
