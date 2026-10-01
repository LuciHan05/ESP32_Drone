import { verifyAdmin } from "@/lib/server/auth";
import { isSupabaseConfigured } from "@/lib/server/config";
import { ApiError, apiFailure, assertSameOrigin, privateJson, readJson } from "@/lib/server/http";
import { createAdminClient } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    if (!isSupabaseConfigured()) throw new ApiError(503, "Administrarea trebuie configurată în Supabase înainte de autentificare.");
    const value = await readJson(request, 4096);
    if (!value || typeof value !== "object" || !("email" in value) || !("password" in value) ||
      typeof value.email !== "string" || typeof value.password !== "string" ||
      value.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim()) ||
      !value.password || value.password.length > 1024) throw new ApiError(400, "Introdu o adresă de e-mail și o parolă valide.");
    const client = await createAdminClient();
    const { data, error } = await client.auth.signInWithPassword({ email: value.email.trim(), password: value.password });
    if (error || !data.user) throw new ApiError(error?.status === 429 ? 429 : 401,
      error?.status === 429 ? "Prea multe încercări. Așteaptă câteva minute." : "E-mail sau parolă incorectă.");
    try { await verifyAdmin(client, data.user); }
    catch (error) {
      await client.auth.signOut({ scope: "local" });
      throw error;
    }
    return privateJson({ user: { email: data.user.email ?? "" } });
  } catch (error) { return apiFailure(error); }
}
