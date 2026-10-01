import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getDefaultContent } from "@/lib/default-content";
import { parseSiteContent } from "@/lib/content-validation";
import type { ContentSnapshot, SiteContent } from "@/lib/content-types";
import { getSupabaseConfig, isSupabaseConfigured } from "./config";
import { ApiError } from "./http";
import { createPublicClient } from "./supabase";

export async function getContentSnapshot(client: SupabaseClient): Promise<ContentSnapshot> {
  const { data, error } = await client.from("drone_content").select("content, revision").eq("id", "main").single();
  if (error || !data) throw new ApiError(503, "Conținutul nu poate fi citit. Verifică migrarea Supabase și conexiunea.");
  return {
    content: data.content === null ? getDefaultContent() : parseSiteContent(data.content, getSupabaseConfig().url),
    revision: data.revision,
  };
}

const getCachedContent = unstable_cache(
  async () => (await getContentSnapshot(createPublicClient())).content,
  ["drone-public-content-v1"],
  { tags: ["site-content"], revalidate: 300 },
);

/** No cookies or per-visitor database requests: the public portfolio stays cached. */
export async function getPublicContent(): Promise<SiteContent> {
  if (!isSupabaseConfigured()) return getDefaultContent();
  return getCachedContent();
}

export async function saveContent(client: SupabaseClient, snapshot: ContentSnapshot, userId: string): Promise<ContentSnapshot> {
  const revision = snapshot.revision + 1;
  if (!Number.isSafeInteger(revision)) throw new ApiError(400, "Versiune invalidă.");
  // A single UPDATE with the previous revision prevents lost updates between tabs.
  const { data, error } = await client.from("drone_content").update({
    content: snapshot.content, revision, updated_by: userId, updated_at: new Date().toISOString(),
  }).eq("id", "main").eq("revision", snapshot.revision).select("revision").maybeSingle();
  if (error) throw new ApiError(503, "Publicarea nu a reușit. Verifică politicile Supabase și încearcă din nou.");
  if (!data) throw new ApiError(409, "Conținutul a fost modificat în altă sesiune. Copiază schimbările tale și reîncarcă versiunea publicată.");
  revalidateTag("site-content", { expire: 0 });
  for (const path of ["/", "/componente", "/constructie", "/cod", "/galerie"]) revalidatePath(path);
  return { content: snapshot.content, revision: data.revision };
}
