import { NextRequest, NextResponse } from "next/server";
import { generateReference } from "@/lib/utils";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendPaymentInstructionsEmail } from "@/lib/email";
import { APPOINTMENT_START_TIMES, BOOKING_DEPOSIT, BUSINESS_HOURS, CLUSTER_LASHES_PRICE, OWN_FIBRE_DISCOUNT, SHORT_HAIR_SURCHARGE } from "@/lib/constants";
import { addMinutes, format, parseISO } from "date-fns";
import { getBookingDisplayMonth, isDateInDisplayMonth } from "@/lib/booking-calendar";
import { studioDateKey, studioDayRange, studioTime } from "@/lib/studio-time";

const db = supabaseAdmin as any;

function isMissingColumn(error: any, column: string) {
  const errorText = [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    errorText.includes(column.toLowerCase()) &&
    (error?.code === "42703" ||
      error?.code === "PGRST204" ||
      errorText.includes("does not exist") ||
      errorText.includes("schema cache"))
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer_name, email, phone, service_id, hair_option_id, secondary_hair_option_id,
      start_time, end_time, short_hair, cluster_lashes, own_fibre,
    } = body;

    if (!customer_name || !email || !phone || !service_id || !start_time || !end_time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const requestedStart = parseISO(start_time);
    const submittedEnd = parseISO(end_time);
    if (Number.isNaN(requestedStart.getTime()) || Number.isNaN(submittedEnd.getTime()) || submittedEnd <= requestedStart) {
      return NextResponse.json({ error: "Please choose a valid appointment time." }, { status: 400 });
    }
    if (requestedStart <= new Date()) {
      return NextResponse.json({ error: "Please choose a future appointment time." }, { status: 400 });
    }

    const requestedTime = studioTime(requestedStart);
    const requestedDate = studioDateKey(requestedStart);
    const displayMonth = await getBookingDisplayMonth();
    if (!isDateInDisplayMonth(requestedDate, displayMonth)) {
      return NextResponse.json(
        { error: `Bookings are currently open for ${format(parseISO(displayMonth), "MMMM yyyy")}.` },
        { status: 400 }
      );
    }
    if (BUSINESS_HOURS.daysOff.includes(parseISO(requestedDate).getDay())) {
      return NextResponse.json({ error: "The studio is closed on the selected day." }, { status: 400 });
    }

    if (!(APPOINTMENT_START_TIMES as readonly string[]).includes(requestedTime)) {
      return NextResponse.json(
        { error: "Please choose one of the available appointment times." },
        { status: 400 }
      );
    }

    const { data: service, error: serviceError } = await db.from("services").select("name, full_price, duration_minutes").eq("id", service_id).eq("is_active", true).single();
    if (serviceError || !service) return NextResponse.json({ error: "Invalid service" }, { status: 400 });

    const requestedEnd = addMinutes(requestedStart, Number(service.duration_minutes));
    const normalizedStartTime = requestedStart.toISOString();
    const normalizedEndTime = requestedEnd.toISOString();

    const dayRange = studioDayRange(requestedDate);
    const dayStart = dayRange.start.toISOString();
    const dayEnd = dayRange.end.toISOString();
    const [confirmedResult, pendingResult, unavailableResult] = await Promise.all([
      db.from("confirmed_bookings").select("start_time, end_time").lt("start_time", normalizedEndTime).gt("end_time", normalizedStartTime),
      db.from("booking_requests").select("start_time, end_time").in("status", ["REQUESTED", "POP_UPLOADED"]).lt("start_time", normalizedEndTime).gt("end_time", normalizedStartTime),
      db.from("availability_blocks").select("start_time, end_time").lt("start_time", dayEnd).gt("end_time", dayStart),
    ]);
    if (confirmedResult.error || pendingResult.error || unavailableResult.error) {
      console.error("Booking availability validation error:", confirmedResult.error || pendingResult.error || unavailableResult.error);
      return NextResponse.json({ error: "Booking availability is not configured. Please contact the studio." }, { status: 503 });
    }
    if ((confirmedResult.data?.length || 0) > 0 || (pendingResult.data?.length || 0) > 0 || (unavailableResult.data || []).some((block: { start_time: string; end_time: string }) => parseISO(block.start_time) < requestedEnd && parseISO(block.end_time) > requestedStart)) {
      return NextResponse.json({ error: "That slot is no longer available. Please choose another time." }, { status: 409 });
    }

    let optionPrice = 0;
    if (hair_option_id) {
      const { data: option, error: optionError } = await db.from("hair_options").select("price_delta, service_id").eq("id", hair_option_id).single();
      if (optionError || !option || option.service_id !== service_id) return NextResponse.json({ error: "Invalid hair option" }, { status: 400 });
      optionPrice = Number(option.price_delta) || 0;
    }
    if (secondary_hair_option_id) {
      const { data: option, error: optionError } = await db.from("hair_options").select("service_id").eq("id", secondary_hair_option_id).single();
      if (optionError || !option || option.service_id !== service_id) return NextResponse.json({ error: "Invalid secondary hair option" }, { status: 400 });
      if (secondary_hair_option_id === hair_option_id) return NextResponse.json({ error: "Primary and secondary hair options must be different" }, { status: 400 });
    }
    const hasShortHair = short_hair === true;
    const hasClusterLashes = cluster_lashes === true;
    const hasOwnFibre = own_fibre === true;
    const totalPrice = Math.max(0, Number(service.full_price) + optionPrice + (hasShortHair ? SHORT_HAIR_SURCHARGE : 0) + (hasClusterLashes ? CLUSTER_LASHES_PRICE : 0) - (hasOwnFibre ? OWN_FIBRE_DISCOUNT : 0));

    const bookingPayload = {
      customer_name, email, phone, service_id,
      hair_option_id: hair_option_id || null,
      secondary_hair_option_id: secondary_hair_option_id || null,
      start_time: normalizedStartTime, end_time: normalizedEndTime, payment_choice: "DEPOSIT", amount_due: BOOKING_DEPOSIT,
      total_price: totalPrice, short_hair: hasShortHair, cluster_lashes: hasClusterLashes, own_fibre: hasOwnFibre,
      status: "REQUESTED",
    };

    let { data: booking, error } = await db
      .from("booking_requests")
      .insert(bookingPayload)
      .select()
      .single();

    // Keep standard bookings working while an older production schema is being migrated.
    // A selected paid add-on must never be silently dropped because the admin relies on it.
    if (error && isMissingColumn(error, "cluster_lashes")) {
      if (hasClusterLashes) {
        console.error("Cluster Lashes booking blocked because the database column is missing:", error);
        return NextResponse.json(
          { error: "Cluster Lashes are temporarily unavailable. Please go back, choose No Thanks, and try again." },
          { status: 503 }
        );
      }

      console.warn("Retrying booking without cluster_lashes while the database migration is pending.");
      const compatiblePayload: Record<string, unknown> = { ...bookingPayload };
      delete compatiblePayload.cluster_lashes;

      const retryResult = await db
        .from("booking_requests")
        .insert(compatiblePayload)
        .select()
        .single();
      booking = retryResult.data;
      error = retryResult.error;
    }

    if (error && isMissingColumn(error, "own_fibre")) {
      if (hasOwnFibre) {
        return NextResponse.json(
          { error: "The bring-your-own-fibre option is temporarily unavailable. Please choose studio-supplied fibre and try again." },
          { status: 503 }
        );
      }

      const compatiblePayload: Record<string, unknown> = { ...bookingPayload };
      delete compatiblePayload.own_fibre;
      const retryResult = await db
        .from("booking_requests")
        .insert(compatiblePayload)
        .select()
        .single();
      booking = retryResult.data;
      error = retryResult.error;
    }

    if (error?.code === "23P01") {
      return NextResponse.json({ error: "That slot was just reserved by another customer. Please choose another time." }, { status: 409 });
    }

    if (error) {
      console.error("Booking insert error:", error);
      return NextResponse.json({ error: "Booking could not be created. Please try another slot or contact the studio." }, { status: 500 });
    }

    const reference = generateReference(booking.id);
    await db.from("booking_requests").update({ reference }).eq("id", booking.id);

    let emailSent = false;
    try {
      await sendPaymentInstructionsEmail({
        customerName: customer_name, email,
        serviceName: service?.name || "Hair Service",
        dateTime: normalizedStartTime, amountDue: BOOKING_DEPOSIT, reference, bookingId: booking.id,
        durationMinutes: service.duration_minutes,
      });
      emailSent = true;
    } catch (emailError) {
      console.error("Payment instructions email failed:", emailError);
    }

    return NextResponse.json({ id: booking.id, reference, amountDue: BOOKING_DEPOSIT, totalPrice, status: "REQUESTED", emailSent }, { status: 201 });
  } catch (err) {
    console.error("Booking error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
