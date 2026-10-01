import type { CodeFile, ConstructionStep, ContentSnapshot, DroneComponent, GalleryImage, SiteContent } from "./content-types";

export class ContentValidationError extends Error {}

function fail(path: string, reason: string): never {
  throw new ContentValidationError(`${path}: ${reason}`);
}

function object(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(path, "trebuie să fie un obiect");
  return value as Record<string, unknown>;
}

function string(value: unknown, path: string, max: number, required = false): string {
  if (typeof value !== "string" || value.length > max || (required && !value.trim())) {
    fail(path, `text ${required ? "obligatoriu, " : ""}maximum ${max} caractere`);
  }
  if (value.includes("\0")) fail(path, "caracter invalid");
  return value;
}

function id(value: unknown, path: string): string {
  const result = string(value, path, 80, true);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(result)) fail(path, "ID invalid");
  return result;
}

function list<T>(value: unknown, path: string, max: number, parse: (value: unknown, path: string) => T): T[] {
  if (!Array.isArray(value) || value.length > max) fail(path, `maximum ${max} elemente`);
  return value.map((item, index) => parse(item, `${path}[${index + 1}]`));
}

function unique<T extends { id: string }>(items: T[], path: string): T[] {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) fail(path, `ID duplicat: ${item.id}`);
    seen.add(item.id);
  }
  return items;
}

export function isSafeImageSource(value: string, supabaseUrl?: string): boolean {
  // Local images are deliberately limited to inert image assets in public/images.
  if (/^\/images\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(?:png|jpe?g|webp|avif)$/i.test(value) && !value.includes("..")) return true;
  if (!supabaseUrl) return false;
  if (value.includes("%") || value.includes("\\") || value.split("/").some(part => part === "." || part === "..")) return false;
  try {
    const url = new URL(value);
    const configured = new URL(supabaseUrl);
    const prefix = "/storage/v1/object/public/drone-images/";
    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    return url.protocol === "https:" && url.origin === configured.origin && !url.username && !url.password &&
      !url.search && !url.hash && url.pathname.startsWith(prefix) &&
      /^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.webp$/.test(path);
  } catch {
    return false;
  }
}

export function isSafeResourceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function parseContentSnapshot(value: unknown, supabaseUrl?: string): ContentSnapshot {
  const snapshot = object(value, "Conținut");
  if (typeof snapshot.revision !== "number" || !Number.isSafeInteger(snapshot.revision) || snapshot.revision < 0) {
    fail("Versiune", "număr întreg pozitiv sau zero necesar");
  }
  return { content: parseSiteContent(snapshot.content, supabaseUrl), revision: snapshot.revision };
}

export function parseSiteContent(value: unknown, supabaseUrl?: string): SiteContent {
  const content = object(value, "Conținut");
  const image = (value: unknown, path: string): GalleryImage => {
    const item = object(value, path);
    const src = string(item.src, `${path}.src`, 2048, true);
    if (!isSafeImageSource(src, supabaseUrl)) fail(`${path}.src`, "imagine locală sau încărcată în acest proiect necesară");
    return { id: id(item.id, `${path}.id`), src, alt: string(item.alt, `${path}.alt`, 300), caption: string(item.caption, `${path}.caption`, 1000) };
  };
  const images = (value: unknown, path: string, max = 30) => unique(list(value, path, max, image), path);
  const gallery = images(content.gallery, "Galerie", 200);
  const heroImageId = content.heroImageId === null ? null : id(content.heroImageId, "Imagine principală");
  if (heroImageId && !gallery.some((item) => item.id === heroImageId)) fail("Imagine principală", "alege o imagine din galerie");
  const components = unique(list(content.components, "Componente", 60, (value, path): DroneComponent => {
    const item = object(value, path);
    if (typeof item.confirmed !== "boolean") fail(path, "stare de confirmare invalidă");
    return {
      id: id(item.id, `${path}.id`), name: string(item.name, `${path}.name`, 160, true),
      value: string(item.value, `${path}.value`, 250), detail: string(item.detail, `${path}.detail`, 6000),
      confirmed: item.confirmed, images: images(item.images, `${path}.images`),
    };
  }), "Componente");
  const steps = unique(list(content.steps, "Etape", 60, (value, path): ConstructionStep => {
    const item = object(value, path);
    if (!["documented", "testing", "planned"].includes(item.status as string)) fail(path, "stare invalidă");
    const result: ConstructionStep = {
      id: id(item.id, `${path}.id`), category: string(item.category, `${path}.category`, 120),
      title: string(item.title, `${path}.title`, 200, true), summary: string(item.summary, `${path}.summary`, 2000),
      status: item.status as ConstructionStep["status"], imageCaption: string(item.imageCaption, `${path}.imageCaption`, 1000),
      documentation: list(item.documentation, `${path}.documentation`, 40, (paragraph, path) => string(paragraph, path, 15000)),
      challenge: string(item.challenge, `${path}.challenge`, 6000), nextToDocument: string(item.nextToDocument, `${path}.nextToDocument`, 6000),
      images: images(item.images, `${path}.images`),
    };
    if (item.media !== undefined) {
      const media = object(item.media, `${path}.media`);
      const src = string(media.src, `${path}.media.src`, 2048, true);
      if (!isSafeImageSource(src, supabaseUrl)) fail(path, "imagine invalidă");
      result.media = { src, alt: string(media.alt, `${path}.media.alt`, 300) };
    }
    if (item.resources !== undefined) {
      result.resources = list(item.resources, `${path}.resources`, 20, (value, path) => {
        const resource = object(value, path);
        const href = string(resource.href, `${path}.href`, 2048, true);
        if (!isSafeResourceUrl(href)) fail(path, "link HTTP/HTTPS necesar");
        return { label: string(resource.label, `${path}.label`, 200, true), href };
      });
    }
    return result;
  }), "Etape");
  const codeFiles = unique(list(content.codeFiles, "Cod", 20, (value, path): CodeFile => {
    const item = object(value, path);
    if (!["cpp", "c", "python", "text"].includes(item.language as string)) fail(path, "limbaj invalid");
    const filename = string(item.filename, `${path}.filename`, 180, true);
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(filename) || filename.includes("..")) fail(path, "nume de fișier invalid");
    return {
      id: id(item.id, `${path}.id`), title: string(item.title, `${path}.title`, 200, true), filename,
      language: item.language as CodeFile["language"], description: string(item.description, `${path}.description`, 6000),
      content: string(item.content, `${path}.content`, 200_000),
    };
  }), "Cod");
  const firmwareUrl = content.firmwareUrl == null || content.firmwareUrl === "" ? null : string(content.firmwareUrl, "Link firmware", 2048, true);
  if (firmwareUrl && (!isSafeResourceUrl(firmwareUrl) || !firmwareUrl.startsWith("https://"))) fail("Link firmware", "link HTTPS necesar");
  return { gallery, heroImageId, components, steps, codeFiles, firmwareUrl };
}
