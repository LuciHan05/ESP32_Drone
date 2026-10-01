import { requireAdmin } from "@/lib/server/auth";
import { apiFailure, privateJson } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user } = await requireAdmin();
    return privateJson({ user: { email: user.email ?? "" } });
  } catch (error) { return apiFailure(error); }
}
