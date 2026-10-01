import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./config";
import { ApiError } from "./http";
import { createAdminClient } from "./supabase";

export async function verifyAdmin(client: SupabaseClient, user: User) {
  const { data, error } = await client.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (error) throw new ApiError(503, "Accesul de administrare nu poate fi verificat. Verifică migrarea Supabase.");
  if (!data) throw new ApiError(403, "Acest cont nu are acces de administrare.");
}

export async function requireAdmin() {
  if (!isSupabaseConfigured()) throw new ApiError(503, "Administrarea trebuie configurată în Supabase înainte de autentificare.");
  const client = await createAdminClient();
  // getUser validates with the Auth server, including session revocation.
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new ApiError(401, "Autentifică-te pentru a continua.");
  await verifyAdmin(client, user);
  return { client, user };
}
