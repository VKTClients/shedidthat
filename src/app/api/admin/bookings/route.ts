import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

const db = supabaseAdmin as any;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = db
    .from("booking_requests")
    .select(`*, services:service_id (name, duration_minutes), hair_options:hair_option_id (name), payment_proofs (*)`)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Admin bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }

  const bookings = await Promise.all((data || []).map(async (booking: any) => {
    const paymentProofs = await Promise.all((booking.payment_proofs || []).map(async (proof: any) => {
      const marker = "/payment-proofs/";
      const path = proof.file_url.includes(marker) ? proof.file_url.split(marker).pop() : proof.file_url;
      const { data: signed } = await db.storage.from("payment-proofs").createSignedUrl(path, 600);
      return { ...proof, file_url: signed?.signedUrl || "" };
    }));
    return { ...booking, payment_proofs: paymentProofs };
  }));
  return NextResponse.json({ bookings });
}
