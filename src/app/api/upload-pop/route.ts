import { NextRequest, NextResponse } from "next/server";
import { ACCEPTED_POP_TYPES, MAX_POP_SIZE_MB } from "@/lib/constants";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendPOPReceivedEmail } from "@/lib/email";

const db = supabaseAdmin as any;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bookingId = formData.get("booking_id") as string;
    const reference = formData.get("reference") as string;

    if (!file || !bookingId || !reference) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!ACCEPTED_POP_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Accepted: PDF, JPG, PNG" },
        { status: 400 }
      );
    }

    if (file.size > MAX_POP_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File too large. Max ${MAX_POP_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${bookingId}-${Date.now()}.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await db.storage
      .from("payment-proofs")
      .upload(fileName, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "File upload failed" }, { status: 500 });
    }

    const { error: insertError } = await db
      .from("payment_proofs")
      .insert({
        booking_request_id: bookingId,
        file_url: fileName,
        reference_used: reference,
        verification_status: "PENDING",
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json({ error: "Failed to save proof record" }, { status: 500 });
    }

    await db.from("booking_requests").update({ status: "POP_UPLOADED" }).eq("id", bookingId);

    const { data: booking } = await db
      .from("booking_requests")
      .select("email, customer_name")
      .eq("id", bookingId)
      .single();

    if (booking) {
      sendPOPReceivedEmail(booking.email, booking.customer_name).catch((err: any) =>
        console.error("Email error:", err)
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Upload POP error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
