import { NextRequest, NextResponse } from "next/server";
import { generateTimeSlots } from "@/lib/utils";
import { supabaseAdmin } from "@/lib/supabase/server";
import { BOOKING_OPEN_DATE } from "@/lib/constants";
import { parseISO, startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const duration = parseInt(searchParams.get("duration") || "60", 10);

    if (!dateStr) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }

    if (dateStr < BOOKING_OPEN_DATE) {
      return NextResponse.json({ error: `Bookings open on ${BOOKING_OPEN_DATE}.` }, { status: 400 });
    }

    const date = parseISO(dateStr);

    const dayStart = startOfDay(date).toISOString();
    const dayEnd = endOfDay(date).toISOString();

    const { data: confirmed } = await (supabaseAdmin as any)
      .from("confirmed_bookings")
      .select("start_time, end_time")
      .gte("start_time", dayStart)
      .lte("start_time", dayEnd);

    const { data: pending } = await (supabaseAdmin as any)
      .from("booking_requests")
      .select("start_time, end_time")
      .in("status", ["REQUESTED", "POP_UPLOADED"])
      .gte("start_time", dayStart)
      .lte("start_time", dayEnd);

    const { data: unavailable, error: unavailableError } = await (supabaseAdmin as any)
      .from("availability_blocks")
      .select("start_time, end_time")
      .lt("start_time", dayEnd)
      .gt("end_time", dayStart);

    if (unavailableError) {
      console.error("Availability blocks error:", unavailableError);
      return NextResponse.json({ error: "Availability is not configured. Please contact the studio." }, { status: 503 });
    }

    const slots = generateTimeSlots(date, duration, confirmed || [], pending || [], unavailable || []);

    return NextResponse.json({
      fullyBooked: slots.length === 0,
      slots: slots.map((s) => ({
        start: s.start.toISOString(),
        end: s.end.toISOString(),
        label: s.label,
      })),
    });
  } catch (err) {
    console.error("Availability error:", err);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}
