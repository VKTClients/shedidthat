import { format, parseISO } from "date-fns";
import { DEFAULT_BOOKING_DISPLAY_MONTH } from "./constants";
import { supabaseAdmin } from "./supabase/server";

const db = supabaseAdmin as any;

export function normalizeDisplayMonth(value: string) {
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(value);
  if (!match) return null;
  const month = `${match[1]}-${match[2]}-01`;
  const parsed = parseISO(month);
  return Number.isNaN(parsed.getTime()) || format(parsed, "yyyy-MM-dd") !== month ? null : month;
}

export async function getBookingDisplayMonth() {
  const { data, error } = await db
    .from("booking_settings")
    .select("display_month")
    .eq("singleton_id", 1)
    .maybeSingle();

  if (error) {
    console.warn("Booking settings unavailable; using the September default:", error.message);
    return DEFAULT_BOOKING_DISPLAY_MONTH;
  }

  return normalizeDisplayMonth(String(data?.display_month || "")) || DEFAULT_BOOKING_DISPLAY_MONTH;
}

export function isDateInDisplayMonth(dateKey: string, displayMonth: string) {
  return dateKey.slice(0, 7) === displayMonth.slice(0, 7);
}
