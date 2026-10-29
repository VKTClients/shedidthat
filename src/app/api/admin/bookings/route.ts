import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { CALENDAR_BOOKING_STATUSES } from "@/lib/constants";

const db = supabaseAdmin as any;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const calendarView = searchParams.get("view") === "calendar";

  let query = db
    .from("booking_requests")
    .select(`*, services:service_id (name, duration_minutes), hair_options:hair_option_id (name), secondary_hair_options:secondary_hair_option_id (name), payment_proofs (*)`)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  } else if (calendarView) {
    query = query.in("status", CALENDAR_BOOKING_STATUSES);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Admin bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }

  const bookingIds = (data || []).map((booking: any) => booking.id);
  const confirmedIds = new Set<string>();
  if (bookingIds.length > 0) {
    const { data: confirmedHolds, error: confirmedHoldsError } = await db
      .from("confirmed_bookings")
      .select("booking_request_id")
      .in("booking_request_id", bookingIds);
    if (confirmedHoldsError) {
      console.error("Confirmed booking status lookup error:", confirmedHoldsError);
      return NextResponse.json({ error: "Failed to verify booking statuses" }, { status: 500 });
    }
    for (const hold of confirmedHolds || []) confirmedIds.add(hold.booking_request_id);
  }

  const bookings = await Promise.all((data || []).map(async (booking: any) => {
    const paymentProofs = await Promise.all((booking.payment_proofs || []).map(async (proof: any) => {
      const marker = "/payment-proofs/";
      const path = proof.file_url.includes(marker) ? proof.file_url.split(marker).pop() : proof.file_url;
      const { data: signed } = await db.storage.from("payment-proofs").createSignedUrl(path, 600);
      return { ...proof, file_url: signed?.signedUrl || "" };
    }));
    return {
      ...booking,
      status: confirmedIds.has(booking.id) ? "CONFIRMED" : booking.status,
      payment_proofs: paymentProofs,
    };
  }));
  return NextResponse.json({ bookings });
}
