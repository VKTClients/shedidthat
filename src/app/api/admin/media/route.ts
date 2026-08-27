import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { SITE_MEDIA_DEFINITIONS } from "@/lib/site-media";

const db = supabaseAdmin as any;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const { data, error } = await db.from("site_media").select("slot_key, image_url, alt_text, updated_at").order("slot_key");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ media: data || [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const formData = await request.formData();
  const slotKey = String(formData.get("slot_key") || "");
  const file = formData.get("file");
  const definition = SITE_MEDIA_DEFINITIONS.find((item) => item.key === slotKey);

  if (!definition) return NextResponse.json({ error: "Unknown website image slot" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to upload" }, { status: 400 });
  if (!allowedTypes.has(file.type)) return NextResponse.json({ error: "Use a JPG, PNG, or WebP image" }, { status: 400 });
  if (file.size > MAX_IMAGE_SIZE) return NextResponse.json({ error: "Images must be 8MB or smaller" }, { status: 400 });

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${slotKey.replace(/[^a-z0-9.-]+/gi, "-")}-${Date.now()}.${extension}`;
  const { error: uploadError } = await db.storage.from("site-media").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: `Image upload failed: ${uploadError.message}` }, { status: 500 });

  const { data: publicUrl } = db.storage.from("site-media").getPublicUrl(path);
  const { data, error } = await db.from("site_media").upsert({ slot_key: slotKey, image_url: publicUrl.publicUrl, alt_text: definition.label }, { onConflict: "slot_key" }).select().single();
  if (error) return NextResponse.json({ error: `Image record could not be saved: ${error.message}` }, { status: 500 });
  return NextResponse.json({ media: data });
}

