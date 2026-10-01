import type { Metadata } from "next";
import { project } from "@/data/project";
import "./globals.css";

export const metadata: Metadata = {
  title: `${project.name} — Jurnalul construirii unei drone`,
  description: project.description,
  applicationName: project.name,
  openGraph: { title: `${project.name} — De la idee la zbor`, description: project.description, locale: "ro_RO", type: "website" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ro"><body><a href="#continut" className="skip-link">Sari la conținut</a>{children}</body></html>;
}
