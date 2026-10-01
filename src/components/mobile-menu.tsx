"use client";

import { Icon } from "./icons";

/** Native details still works without JS; this only closes it after navigation. */
export function MobileMenu({ links, active }: { links: { href: string; label: string }[]; active?: string }) {
  return <details className="mobile-menu"
    onClick={(event) => {
      if (event.target instanceof Element && event.target.closest("a")) event.currentTarget.open = false;
    }}
    onKeyDown={(event) => {
      if (event.key === "Escape") {
        event.currentTarget.open = false;
        event.currentTarget.querySelector("summary")?.focus();
      }
    }}
    onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
    }}
  >
    <summary aria-label="Meniu de navigare"><span>Meniu</span><Icon name="plus" /></summary>
    <nav aria-label="Navigare mobilă">{links.map(link => <a key={link.href} href={link.href} aria-current={active === link.href ? "page" : undefined}>{link.label}</a>)}</nav>
  </details>;
}
