import type { Metadata } from "next";
import Link from "next/link";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { isSupabaseConfigured } from "@/lib/server/config";
import "./admin.css";

export const metadata: Metadata = {
  title: "Administrare | ESP32_DRONE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <main id="continut" className="admin-shell">
      <header className="admin-header">
        <Link href="/" className="admin-brand">ESP32<span>_</span>DRONE</Link>
        <span className="admin-header-label">SPAȚIU DE ADMINISTRARE</span>
        <Link className="admin-site-link" href="/">Înapoi la site <span aria-hidden="true">↗</span></Link>
      </header>
      {isSupabaseConfigured() ? <AdminWorkspace /> : <SetupRequired />}
    </main>
  );
}

function SetupRequired() {
  return (
    <section className="admin-entry admin-setup" aria-labelledby="setup-title">
      <span className="admin-kicker">01 / PREGĂTIRE</span>
      <h1 id="setup-title">Atelierul tău digital.</h1>
      <p className="admin-intro">Un loc pentru fotografii, componente, etape și cod. Doar tu poți modifica proiectul, după autentificare.</p>
      <div className="admin-callout">
        <strong>Conectarea la Supabase este necesară</strong>
        <p>Încărcarea și publicarea vor deveni disponibile după configurarea proiectului nou. În acest moment, nu sunt salvate fotografii sau modificări.</p>
      </div>
      <ol className="admin-setup-list">
        <li><span>01</span><div><strong>Creează proiectul Supabase</strong><p>Alege regiunea europeană potrivită și păstrează datele de acces în siguranță.</p></div></li>
        <li><span>02</span><div><strong>Activează baza de date și stocarea</strong><p>Rulează migrarea din proiect și configurează contul tău de administrator conform README.</p></div></li>
        <li><span>03</span><div><strong>Conectează site-ul</strong><p>Adaugă variabilele din <code>.env.example</code> în Vercel, apoi fă un nou deployment. Nu trimite parole sau chei în chat.</p></div></li>
      </ol>
      <Link className="admin-button admin-button-primary" href="/">Vezi proiectul <span aria-hidden="true">↗</span></Link>
    </section>
  );
}
