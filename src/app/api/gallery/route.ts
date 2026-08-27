import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const gallery = new URL(request.url).searchParams.get("gallery");
  if (gallery !== "reviews" && gallery !== "client-cam") return NextResponse.json({ error: "Unknown gallery" }, { status: 400 });
  const { data, error } = await (supabaseAdmin as any)
    .from("gallery_images")
    .select("id, gallery_key, image_url, alt_text, sort_order")
    .eq("gallery_key", gallery)
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ images: [] });
  return NextResponse.json({ images: data || [] });
}

