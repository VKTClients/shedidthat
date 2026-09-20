import { NextRequest, NextResponse } from "next/server";
import { addDays, eachDayOfInterval, format, parseISO } from "date-fns";
import { generateTimeSlots } from "@/lib/utils";
import { supabaseAdmin } from "@/lib/supabase/server";
import { BOOKING_WINDOW_END, BUSINESS_HOURS } from "@/lib/constants";
import { getBookingDisplayMonth, isDateInDisplayMonth } from "@/lib/booking-calendar";
import { studioDateKey, studioDayRange } from "@/lib/studio-time";

const db = supabaseAdmin as any;
export const dynamic = "force-dynamic";

async function loadCalendarData(rangeStart: string, rangeEnd: string) {
  const [confirmedResult, pendingResult, unavailableResult] = await Promise.all([
    db.from("confirmed_bookings").select("start_time, end_time").lt("start_time", rangeEnd).gt("end_time", rangeStart),
    db.from("booking_requests").select("start_time, end_time").in("status", ["REQUESTED", "POP_UPLOADED"]).lt("start_time", rangeEnd).gt("end_time", rangeStart),
    db.from("availability_blocks").select("start_time, end_time").lt("start_time", rangeEnd).gt("end_time", rangeStart),
  ]);

  const error = confirmedResult.error || pendingResult.error || unavailableResult.error;
  if (error) throw error;
  return {
    confirmed: confirmedResult.data || [],
    pending: pendingResult.data || [],
    unavailable: unavailableResult.data || [],
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const duration = Number.parseInt(searchParams.get("duration") || "60", 10);
    if (!Number.isFinite(duration) || duration < 1 || duration > 300) {
      return NextResponse.json({ error: "Choose a valid service duration" }, { status: 400 });
    }

    const displayMonth = await getBookingDisplayMonth();

    if (!dateStr) {
      const monthStart = parseISO(displayMonth);
      const monthEnd = parseISO(BOOKING_WINDOW_END);
      const rangeStart = studioDayRange(displayMonth).start.toISOString();
      const rangeEnd = studioDayRange(format(addDays(monthEnd, 1), "yyyy-MM-dd")).start.toISOString();
      const data = await loadCalendarData(rangeStart, rangeEnd);
      const todayKey = studioDateKey(new Date());
      const availability: Record<string, string[]> = {};

      for (const date of eachDayOfInterval({ start: monthStart, end: monthEnd })) {
        const dateKey = format(date, "yyyy-MM-dd");
        const isClosedDay = BUSINESS_HOURS.daysOff.includes(date.getDay());
        availability[dateKey] = isClosedDay || dateKey < todayKey
          ? []
          : generateTimeSlots(date, duration, data.confirmed, data.pending, data.unavailable).map((slot) => slot.label);
      }

      return NextResponse.json({ displayMonth, availability });
    }

    const date = parseISO(dateStr);
    if (Number.isNaN(date.getTime()) || format(date, "yyyy-MM-dd") !== dateStr) {
      return NextResponse.json({ error: "Choose a valid date" }, { status: 400 });
    }
    if (!isDateInDisplayMonth(dateStr, displayMonth)) {
      return NextResponse.json(
        { error: "Bookings are currently open for September 2026 and 1–14 October 2026." },
        { status: 400 }
      );
    }
    if (BUSINESS_HOURS.daysOff.includes(date.getDay())) {
      return NextResponse.json({ fullyBooked: true, slots: [], displayMonth });
    }

    const range = studioDayRange(dateStr);
    const data = await loadCalendarData(range.start.toISOString(), range.end.toISOString());
    const slots = generateTimeSlots(date, duration, data.confirmed, data.pending, data.unavailable);

    return NextResponse.json({
      displayMonth,
      fullyBooked: slots.length === 0,
      slots: slots.map((slot) => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        label: slot.label,
      })),
    });
  } catch (error) {
    console.error("Availability error:", error);
    return NextResponse.json({ error: "Availability is not configured. Please contact the studio." }, { status: 503 });
  }
}
