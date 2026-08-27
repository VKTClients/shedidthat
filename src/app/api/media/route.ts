import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await (supabaseAdmin as any)
    .from("site_media")
    .select("slot_key, image_url")
    .order("slot_key");

  if (error) return NextResponse.json({ media: {} });
  return NextResponse.json({ media: Object.fromEntries((data || []).map((item: any) => [item.slot_key, item.image_url])) });
}

