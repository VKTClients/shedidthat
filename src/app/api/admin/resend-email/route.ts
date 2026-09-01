import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sendBookingConfirmedEmail, sendBookingRejectedEmail, sendPaymentInstructionsEmail, sendPOPReceivedEmail } from "@/lib/email";

const db = supabaseAdmin as any;

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  try {
    const { booking_id } = await request.json();
    if (!booking_id) return NextResponse.json({ error: "Missing booking_id" }, { status: 400 });
    const { data: booking, error } = await db.from("booking_requests")
      .select("*, services:service_id (name, duration_minutes)").eq("id", booking_id).single();
    if (error || !booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const data = {
      customerName: booking.customer_name, email: booking.email,
      serviceName: booking.services?.name || "Hair Service", dateTime: booking.start_time,
      amountDue: booking.amount_due, reference: booking.reference, bookingId: booking.id,
      durationMinutes: booking.services?.duration_minutes || 0,
    };
    if (booking.status === "REQUESTED") await sendPaymentInstructionsEmail(data);
    else if (booking.status === "POP_UPLOADED") await sendPOPReceivedEmail(booking.email, booking.customer_name);
    else if (booking.status === "CONFIRMED") await sendBookingConfirmedEmail(data);
    else if (booking.status === "REJECTED") await sendBookingRejectedEmail(booking.email, booking.customer_name);
    else return NextResponse.json({ error: "This booking has no resendable email." }, { status: 409 });
    return NextResponse.json({ success: true, emailSent: true });
  } catch (resendError) {
    console.error("Email resend failed:", resendError);
    return NextResponse.json({ error: "Email could not be sent. Check the Resend configuration." }, { status: 502 });
  }
}
