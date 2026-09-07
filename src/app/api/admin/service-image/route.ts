import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

const db = supabaseAdmin as any;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const formData = await request.formData();
  const serviceId = String(formData.get("service_id") || "");
  const file = formData.get("file");

  if (!serviceId) return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to upload" }, { status: 400 });
  if (!allowedTypes.has(file.type)) return NextResponse.json({ error: "Use a JPG, PNG, or WebP image" }, { status: 400 });
  if (file.size > MAX_IMAGE_SIZE) return NextResponse.json({ error: "Images must be 8MB or smaller" }, { status: 400 });

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `services/${serviceId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await db.storage.from("site-media").upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) return NextResponse.json({ error: `Image upload failed: ${uploadError.message}` }, { status: 500 });

  const { data: publicUrl } = db.storage.from("site-media").getPublicUrl(path);
  const { data, error: updateError } = await db
    .from("services")
    .update({ image_url: publicUrl.publicUrl })
    .eq("id", serviceId)
    .select("*")
    .single();

  if (updateError) {
    await db.storage.from("site-media").remove([path]);
    return NextResponse.json({ error: `Image record could not be saved: ${updateError.message}` }, { status: 500 });
  }

  return NextResponse.json({ service: data, image_url: publicUrl.publicUrl });
}
