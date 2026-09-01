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
      .select("*, services:service_id (name, duration_minutes)")
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
      let emailSent = false;
      try {
        await sendBookingConfirmedEmail({
          customerName: booking.customer_name,
          email: booking.email,
          serviceName,
          dateTime: booking.start_time,
          amountDue: booking.amount_due,
          reference: booking.reference,
          bookingId: booking.id,
          durationMinutes: booking.services?.duration_minutes || 0,
        });
        emailSent = true;
      } catch (emailError) {
        console.error("Booking confirmation email failed:", emailError);
      }

      return NextResponse.json({ success: true, status: "CONFIRMED", emailSent });
    }

    if (action === "REJECT") {
      if (booking.status !== "REQUESTED" && booking.status !== "POP_UPLOADED") {
        return NextResponse.json({ error: "Only pending bookings can be rejected." }, { status: 409 });
      }

      // A rejected request must never retain a confirmed-booking hold. This is
      // defensive cleanup for older databases and makes the release explicit.
      const { error: holdCleanupError } = await db
        .from("confirmed_bookings")
        .delete()
        .eq("booking_request_id", booking_id);
      if (holdCleanupError) {
        console.error("Rejected booking hold cleanup error:", holdCleanupError);
        return NextResponse.json({ error: "The booking could not be released. Please try again." }, { status: 500 });
      }

      const { error: rejectError } = await db
        .from("booking_requests")
        .update({ status: "REJECTED" })
        .eq("id", booking_id)
        .in("status", ["REQUESTED", "POP_UPLOADED"]);
      if (rejectError) {
        console.error("Reject booking update error:", rejectError);
        return NextResponse.json({ error: "The booking could not be rejected. Please try again." }, { status: 500 });
      }

      const { error: proofError } = await db
        .from("payment_proofs")
        .update({ verification_status: "REJECTED", review_note: note || null })
        .eq("booking_request_id", booking_id);
      if (proofError) {
        console.error("Reject payment proof update error:", proofError);
        return NextResponse.json({ error: "Booking rejected, but the payment proof status could not be updated." }, { status: 500 });
      }

      let emailSent = false;
      try {
        await sendBookingRejectedEmail(booking.email, booking.customer_name, note);
        emailSent = true;
      } catch (emailError) {
        console.error("Booking rejection email failed:", emailError);
      }

      return NextResponse.json({ success: true, status: "REJECTED", emailSent });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Review error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
