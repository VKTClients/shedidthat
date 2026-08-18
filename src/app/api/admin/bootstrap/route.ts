import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const db = supabaseAdmin as any;

async function registrationIsOpen() {
  const { data, error } = await db.from("admin_users").select("user_id").eq("singleton_id", 1).limit(1);
  if (error) throw error;
  return !data?.length;
}

export async function GET() {
  try {
    return NextResponse.json({ registrationOpen: await registrationIsOpen() });
  } catch {
    return NextResponse.json({ error: "Admin setup is not configured. Run the production migration first." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let createdUserId: string | undefined;
  try {
    if (!(await registrationIsOpen())) return NextResponse.json({ error: "Admin registration is permanently closed." }, { status: 409 });
    const { email, password, setupCode } = await request.json();
    const expected = process.env.ADMIN_SETUP_TOKEN;
    const supplied = String(setupCode || "");
    if (!expected || expected.length !== supplied.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) {
      return NextResponse.json({ error: "Invalid private setup code." }, { status: 403 });
    }
    if (!String(email || "").includes("@") || String(password || "").length < 12) {
      return NextResponse.json({ error: "Use a valid email and a password of at least 12 characters." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: String(email).trim().toLowerCase(), password: String(password), email_confirm: true,
      app_metadata: { role: "admin" },
    });
    if (error || !data.user) return NextResponse.json({ error: error?.message || "Could not create admin." }, { status: 400 });
    createdUserId = data.user.id;
    const { error: insertError } = await db.from("admin_users").insert({ singleton_id: 1, user_id: data.user.id, email: data.user.email });
    if (insertError) throw insertError;
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (createdUserId) await supabaseAdmin.auth.admin.deleteUser(createdUserId).catch(() => undefined);
    console.error("Admin bootstrap error:", error);
    return NextResponse.json({ error: "Admin registration failed. It may already be complete." }, { status: 409 });
  }
}
