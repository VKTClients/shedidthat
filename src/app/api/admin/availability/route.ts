import { NextRequest, NextResponse } from "next/server";
import { addMinutes, addMonths, format, parseISO } from "date-fns";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { APPOINTMENT_START_TIMES, BUSINESS_HOURS } from "@/lib/constants";
import { getBookingDisplayMonth, normalizeDisplayMonth } from "@/lib/booking-calendar";
import { studioDateTime, studioDayRange, studioTime } from "@/lib/studio-time";

const db = supabaseAdmin as any;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const date = request.nextUrl.searchParams.get("date");
  const month = request.nextUrl.searchParams.get("month");
  let query = db.from("availability_blocks").select("*").order("start_time", { ascending: true });
  if (date) {
    const parsed = parseISO(date);
    if (Number.isNaN(parsed.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    const range = studioDayRange(date);
    query = query.lt("start_time", range.end.toISOString()).gt("end_time", range.start.toISOString());
  } else if (month) {
    const normalizedMonth = normalizeDisplayMonth(month);
    if (!normalizedMonth) return NextResponse.json({ error: "Invalid month" }, { status: 400 });
    const nextMonth = format(addMonths(parseISO(normalizedMonth), 1), "yyyy-MM-dd");
    query = query
      .lt("start_time", studioDayRange(nextMonth).start.toISOString())
      .gt("end_time", studioDayRange(normalizedMonth).start.toISOString());
  }

  const { data, error } = await query;
  if (error) {
    console.error("Admin availability error:", error);
    return NextResponse.json({ error: "Unable to load availability" }, { status: 500 });
  }
  return NextResponse.json({ blocks: data || [], displayMonth: await getBookingDisplayMonth() });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const body = await request.json();
  if (body.date && typeof body.available === "boolean") {
    const date = String(body.date);
    const parsed = parseISO(date);
    if (Number.isNaN(parsed.getTime()) || format(parsed, "yyyy-MM-dd") !== date) {
      return NextResponse.json({ error: "Choose a valid date" }, { status: 400 });
    }
    const range = studioDayRange(date);
    if (body.available) {
      const deleteResult = await db
        .from("availability_blocks")
        .delete()
        .lt("start_time", range.end.toISOString())
        .gt("end_time", range.start.toISOString());
      if (deleteResult.error) {
        console.error("Restore day availability error:", deleteResult.error);
        return NextResponse.json({ error: "Unable to restore this day" }, { status: 500 });
      }
    } else {
      const existingResult = await db
        .from("availability_blocks")
        .select("start_time")
        .lt("start_time", range.end.toISOString())
        .gt("end_time", range.start.toISOString());
      if (existingResult.error) {
        console.error("Load day availability error:", existingResult.error);
        return NextResponse.json({ error: "Unable to update this day" }, { status: 500 });
      }
      const existingStarts = new Set((existingResult.data || []).map((block: { start_time: string }) => studioTime(parseISO(block.start_time))));
      const blocks = APPOINTMENT_START_TIMES.filter((time) => !existingStarts.has(time)).map((time) => {
        const start = studioDateTime(date, time);
        return {
          start_time: start.toISOString(),
          end_time: addMinutes(start, BUSINESS_HOURS.slotInterval).toISOString(),
          reason: "Day unavailable by studio",
        };
      });
      const insertResult = blocks.length > 0 ? await db.from("availability_blocks").insert(blocks) : { error: null };
      if (insertResult.error) {
        console.error("Block day availability error:", insertResult.error);
        return NextResponse.json({ error: "Unable to make this day unavailable" }, { status: 500 });
      }
    }
    return NextResponse.json({ success: true });
  }

  const start = parseISO(String(body.start_time || ""));
  const end = parseISO(String(body.end_time || ""));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return NextResponse.json({ error: "Choose a valid unavailable time range" }, { status: 400 });
  }

  const { data, error } = await db.from("availability_blocks").insert({
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    reason: String(body.reason || "").trim(),
  }).select().single();
  if (error) {
    console.error("Create availability block error:", error);
    return NextResponse.json({ error: "Unable to save unavailable time" }, { status: 500 });
  }
  return NextResponse.json({ block: data });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  const body = await request.json();
  const displayMonth = normalizeDisplayMonth(String(body.display_month || ""));
  if (!displayMonth) return NextResponse.json({ error: "Choose a valid display month" }, { status: 400 });

  const { error } = await db.from("booking_settings").upsert({
    singleton_id: 1,
    display_month: displayMonth,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error("Booking display month error:", error);
    return NextResponse.json({ error: "Unable to set the customer display month. Apply the booking settings migration first." }, { status: 503 });
  }
  return NextResponse.json({ displayMonth });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Availability block ID required" }, { status: 400 });

  const { error } = await db.from("availability_blocks").delete().eq("id", id);
  if (error) {
    console.error("Delete availability block error:", error);
    return NextResponse.json({ error: "Unable to restore this time" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
