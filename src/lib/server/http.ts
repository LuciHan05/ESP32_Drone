import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Vary": "Cookie",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function apiFailure(error: unknown) {
  if (error instanceof ApiError) return privateJson({ error: error.message }, error.status);
  // Never return provider diagnostics, credentials or user data to the browser.
  console.error("Admin API request failed:", error instanceof Error ? error.message : "unknown error");
  return privateJson({ error: "Serviciul nu este disponibil. Verifică setările Supabase și încearcă din nou." }, 503);
}

/** API mutations only accept browser requests from their own origin. */
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  // Next can expose an internal localhost URL behind its HTTP server or Vercel.
  // Host is the actual browser request target; never trust X-Forwarded-Host here.
  const targetHost = request.headers.get("host") || new URL(request.url).host;
  let matches = false;
  if (origin) {
    try {
      const source = new URL(origin);
      matches = source.origin === origin && ["http:", "https:"].includes(source.protocol) && source.host === targetHost;
    } catch { /* Reject malformed or opaque origins. */ }
  }
  if (!matches || (fetchSite && fetchSite !== "same-origin")) {
    throw new ApiError(403, "Cererea nu provine de pe acest site.");
  }
}

export async function readLimitedBody(request: Request, maxBytes: number): Promise<Uint8Array> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > maxBytes)) {
    throw new ApiError(413, "Conținutul depășește dimensiunea permisă.");
  }
  if (!request.body) throw new ApiError(400, "Cerere fără conținut.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new ApiError(413, "Conținutul depășește dimensiunea permisă.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

export async function readJson(request: Request, maxBytes = 1_000_000): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    throw new ApiError(415, "Este necesar conținut JSON.");
  }
  const bytes = await readLimitedBody(request, maxBytes);
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new ApiError(400, "Conținut JSON invalid.");
  }
}
