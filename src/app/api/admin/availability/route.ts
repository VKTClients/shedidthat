import { NextRequest, NextResponse } from "next/server";
import { endOfDay, parseISO, startOfDay } from "date-fns";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

const db = supabaseAdmin as any;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const date = request.nextUrl.searchParams.get("date");
  let query = db.from("availability_blocks").select("*").order("start_time", { ascending: true });
  if (date) {
    const parsed = parseISO(date);
    if (Number.isNaN(parsed.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    query = query.gte("start_time", startOfDay(parsed).toISOString()).lte("start_time", endOfDay(parsed).toISOString());
  }

  const { data, error } = await query;
  if (error) {
    console.error("Admin availability error:", error);
    return NextResponse.json({ error: "Unable to load availability" }, { status: 500 });
  }
  return NextResponse.json({ blocks: data || [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const body = await request.json();
  const start = parseISO(String(body.start_time || ""));
  const end = parseISO(String(body.end_time || ""));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return NextResponse.json({ error: "Choose a valid unavailable time range" }, { status: 400 });
  }

  const { data, error } = await db.from("availability_blocks").insert({
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    reason: String(body.reason || "").trim(),
  }).select().single();
  if (error) {
    console.error("Create availability block error:", error);
    return NextResponse.json({ error: "Unable to save unavailable time" }, { status: 500 });
  }
  return NextResponse.json({ block: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Availability block ID required" }, { status: 400 });

  const { error } = await db.from("availability_blocks").delete().eq("id", id);
  if (error) {
    console.error("Delete availability block error:", error);
    return NextResponse.json({ error: "Unable to restore this time" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
