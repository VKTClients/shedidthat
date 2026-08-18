import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

const db = supabaseAdmin as any;

// GET all services
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.response) return auth.response;
  const { data, error } = await db
    .from("services")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ services: data });
}

// POST create a service
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.response) return auth.response;
  const body = await req.json();
  const { name, description, duration_minutes, full_price, deposit_type, deposit_value, has_hair_options, image_url } = body;

  const duration = Number(duration_minutes);
  const price = Number(full_price);
  const deposit = Number(deposit_value);
  const validDepositType = deposit_type === "PERCENTAGE" || deposit_type === "FIXED";

  if (!String(name || "").trim() || !Number.isFinite(duration) || duration <= 0 || !Number.isFinite(price) || price < 0 || !validDepositType) {
    return NextResponse.json({ error: "Name, duration, and price are required" }, { status: 400 });
  }
  if (!Number.isFinite(deposit) || deposit < 0 || (deposit_type === "PERCENTAGE" && deposit > 100)) {
    return NextResponse.json({ error: "Enter a valid deposit value" }, { status: 400 });
  }

  const { data, error } = await db.from("services").insert({
    name: String(name).trim(),
    description: description || "",
    duration_minutes: duration,
    full_price: price,
    deposit_type: deposit_type || "PERCENTAGE",
    deposit_value: deposit,
    has_hair_options: Boolean(has_hair_options),
    image_url: image_url || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service: data });
}

// PUT update a service
export async function PUT(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.response) return auth.response;
  const body = await req.json();
  const { id } = body;

  if (!id) return NextResponse.json({ error: "Service ID required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.description !== undefined) updates.description = String(body.description);
  if (body.duration_minutes !== undefined) updates.duration_minutes = Number(body.duration_minutes);
  if (body.full_price !== undefined) updates.full_price = Number(body.full_price);
  if (body.deposit_type !== undefined) updates.deposit_type = body.deposit_type;
  if (body.deposit_value !== undefined) updates.deposit_value = Number(body.deposit_value);
  if (body.has_hair_options !== undefined) updates.has_hair_options = Boolean(body.has_hair_options);
  if (body.image_url !== undefined) updates.image_url = body.image_url || null;

  if (updates.name === "" || (updates.duration_minutes !== undefined && (!Number.isFinite(Number(updates.duration_minutes)) || Number(updates.duration_minutes) <= 0)) || (updates.full_price !== undefined && (!Number.isFinite(Number(updates.full_price)) || Number(updates.full_price) < 0))) {
    return NextResponse.json({ error: "Enter a valid name, duration, and price" }, { status: 400 });
  }
  if (updates.deposit_type !== undefined && updates.deposit_type !== "PERCENTAGE" && updates.deposit_type !== "FIXED") {
    return NextResponse.json({ error: "Enter a valid deposit type" }, { status: 400 });
  }
  if (updates.deposit_value !== undefined && (!Number.isFinite(Number(updates.deposit_value)) || Number(updates.deposit_value) < 0 || (updates.deposit_type === "PERCENTAGE" && Number(updates.deposit_value) > 100))) {
    return NextResponse.json({ error: "Enter a valid deposit value" }, { status: 400 });
  }

  const { data, error } = await db
    .from("services")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service: data });
}

// DELETE a service
export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.response) return auth.response;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Service ID required" }, { status: 400 });

  // Delete associated hair options first
  await db.from("hair_options").delete().eq("service_id", id);

  const { error } = await db.from("services").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
