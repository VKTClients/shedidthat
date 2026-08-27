import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

const db = supabaseAdmin as any;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const { data, error } = await db.from("gallery_images").select("id, gallery_key, image_url, alt_text, sort_order, created_at").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ images: data || [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const formData = await request.formData();
  const galleryKey = String(formData.get("gallery_key") || "");
  const file = formData.get("file");
  if (galleryKey !== "reviews" && galleryKey !== "client-cam") return NextResponse.json({ error: "Choose a valid gallery" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to upload" }, { status: 400 });
  if (!allowedTypes.has(file.type)) return NextResponse.json({ error: "Use a JPG, PNG, or WebP image" }, { status: 400 });
  if (file.size > MAX_IMAGE_SIZE) return NextResponse.json({ error: "Images must be 8MB or smaller" }, { status: 400 });

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${galleryKey}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await db.storage.from("site-media").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: `Image upload failed: ${uploadError.message}` }, { status: 500 });
  const { data: publicUrl } = db.storage.from("site-media").getPublicUrl(path);
  const { data: latest } = await db.from("gallery_images").select("sort_order").eq("gallery_key", galleryKey).order("sort_order", { ascending: false }).limit(1);
  const sortOrder = Number(latest?.[0]?.sort_order || 0) + 1;
  const { data, error } = await db.from("gallery_images").insert({ gallery_key: galleryKey, image_url: publicUrl.publicUrl, alt_text: galleryKey === "reviews" ? "Client review" : "Client hairstyle" , sort_order: sortOrder }).select().single();
  if (error) return NextResponse.json({ error: `Gallery image could not be saved: ${error.message}` }, { status: 500 });
  return NextResponse.json({ image: data });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Image ID required" }, { status: 400 });
  const { error } = await db.from("gallery_images").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

