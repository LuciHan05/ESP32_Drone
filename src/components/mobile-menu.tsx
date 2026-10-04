"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./icons";

/** Native links navigate normally; dismiss only from outside the menu or with Escape. */
export function MobileMenu({ links, active }: { links: { href: string; label: string }[]; active?: string }) {
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const menu = menuRef.current;
      if (menu && event.target instanceof Node && !menu.contains(event.target)) menu.open = false;
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  return <details ref={menuRef} className="mobile-menu"
    onKeyDown={(event) => {
      if (event.key === "Escape") {
        event.currentTarget.open = false;
        event.currentTarget.querySelector("summary")?.focus();
      }
    }}
  >
    <summary aria-label="Meniu de navigare"><span>Meniu</span><Icon name="plus" /></summary>
    <nav aria-label="Navigare mobilă">{links.map(link => <a key={link.href} href={link.href} aria-current={active === link.href ? "page" : undefined}>{link.label}</a>)}</nav>
  </details>;
}
