import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendBookingConfirmedEmail, sendBookingRejectedEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/admin-auth";

const db = supabaseAdmin as any;

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  try {
    const { booking_id, action, note } = await request.json();

    if (!booking_id || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await db
      .from("booking_requests")
      .select("*, services:service_id (name)")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (action === "APPROVE") {
      const { data: conflicts } = await db
        .from("confirmed_bookings")
        .select("id")
        .lt("start_time", booking.end_time)
        .gt("end_time", booking.start_time);

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          { error: "Slot no longer available. Another booking was confirmed for this time." },
          { status: 409 }
        );
      }

      const { error: confirmError } = await db
        .from("confirmed_bookings")
        .insert({
          booking_request_id: booking.id,
          start_time: booking.start_time,
          end_time: booking.end_time,
        });

      if (confirmError) {
        console.error("Confirm error:", confirmError);
        return NextResponse.json({ error: "Failed to confirm booking" }, { status: 500 });
      }

      await db.from("booking_requests").update({ status: "CONFIRMED" }).eq("id", booking_id);
      await db.from("payment_proofs").update({ verification_status: "APPROVED", review_note: note || null }).eq("booking_request_id", booking_id);

      const serviceName = booking.services?.name || "Hair Service";
      sendBookingConfirmedEmail({
        customerName: booking.customer_name,
        email: booking.email,
        serviceName,
        dateTime: booking.start_time,
        amountDue: booking.amount_due,
        reference: booking.reference,
        bookingId: booking.id,
      }).catch((err: any) => console.error("Email error:", err));

      return NextResponse.json({ success: true, status: "CONFIRMED" });
    }

    if (action === "REJECT") {
      await db.from("booking_requests").update({ status: "REJECTED" }).eq("id", booking_id);
      await db.from("payment_proofs").update({ verification_status: "REJECTED", review_note: note || null }).eq("booking_request_id", booking_id);

      sendBookingRejectedEmail(booking.email, booking.customer_name, note).catch(
        (err: any) => console.error("Email error:", err)
      );

      return NextResponse.json({ success: true, status: "REJECTED" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Review error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
