import "server-only";

export const IMAGE_BUCKET = "drone-images";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase nu este configurat. Urmează docs/ADMIN_SETUP.md.");
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.pathname !== "/" || parsed.username || parsed.password) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL trebuie să fie originea HTTPS a proiectului.");
  }
  return { url: parsed.origin, key };
}
