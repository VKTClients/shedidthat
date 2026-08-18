import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function requireAdmin(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!token) return { response: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) return { response: NextResponse.json({ error: "Invalid or expired session" }, { status: 401 }) };

  const { data, error } = await (supabaseAdmin as any)
    .from("admin_users")
    .select("user_id")
    .eq("singleton_id", 1)
    .eq("user_id", userData.user.id)
    .limit(1);
  if (error || !data?.length) return { response: NextResponse.json({ error: "This account is not the studio admin" }, { status: 403 }) };
  return { user: userData.user };
}
