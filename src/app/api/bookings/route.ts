import { NextRequest, NextResponse } from "next/server";
import { generateReference, isNextWeek } from "@/lib/utils";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendPaymentInstructionsEmail } from "@/lib/email";
import { BOOKING_DEPOSIT, CLUSTER_LASHES_PRICE, SHORT_HAIR_SURCHARGE } from "@/lib/constants";
import { parseISO } from "date-fns";

const db = supabaseAdmin as any;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer_name, email, phone, service_id, hair_option_id,
      start_time, end_time, short_hair, cluster_lashes,
    } = body;

    if (!customer_name || !email || !phone || !service_id || !start_time || !end_time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (isNextWeek(parseISO(start_time))) {
      return NextResponse.json({ error: "Next week is completely booked out. Please choose another date." }, { status: 409 });
    }

    const { data: service, error: serviceError } = await db.from("services").select("name, full_price, duration_minutes").eq("id", service_id).eq("is_active", true).single();
    if (serviceError || !service) return NextResponse.json({ error: "Invalid service" }, { status: 400 });

    let optionPrice = 0;
    if (hair_option_id) {
      const { data: option, error: optionError } = await db.from("hair_options").select("price_delta, service_id").eq("id", hair_option_id).single();
      if (optionError || !option || option.service_id !== service_id) return NextResponse.json({ error: "Invalid hair option" }, { status: 400 });
      optionPrice = Number(option.price_delta) || 0;
    }
    const hasShortHair = short_hair === true;
    const hasClusterLashes = cluster_lashes === true;
    const totalPrice = Number(service.full_price) + optionPrice + (hasShortHair ? SHORT_HAIR_SURCHARGE : 0) + (hasClusterLashes ? CLUSTER_LASHES_PRICE : 0);

    const { data: booking, error } = await db
      .from("booking_requests")
      .insert({
        customer_name, email, phone, service_id,
        hair_option_id: hair_option_id || null,
        start_time, end_time, payment_choice: "DEPOSIT", amount_due: BOOKING_DEPOSIT,
        total_price: totalPrice, short_hair: hasShortHair, cluster_lashes: hasClusterLashes,
        status: "REQUESTED",
      })
      .select()
      .single();

    if (error) {
      console.error("Booking insert error:", error);
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    const reference = generateReference(booking.id);
    await db.from("booking_requests").update({ reference }).eq("id", booking.id);

    sendPaymentInstructionsEmail({
      customerName: customer_name, email,
      serviceName: service?.name || "Hair Service",
      dateTime: start_time, amountDue: BOOKING_DEPOSIT, reference, bookingId: booking.id,
      durationMinutes: service.duration_minutes,
    }).catch((err: any) => console.error("Email send error:", err));

    return NextResponse.json({ id: booking.id, reference, amountDue: BOOKING_DEPOSIT, totalPrice, status: "REQUESTED" });
  } catch (err) {
    console.error("Booking error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
