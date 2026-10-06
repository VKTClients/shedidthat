import { format, addMinutes, isBefore, isAfter, parseISO } from "date-fns";
import { AFTER_HOURS_START_TIME, APPOINTMENT_START_TIMES, BUSINESS_HOURS, CLASS_BLOCKED_DATE_RANGES, CLASS_TIME_BLOCKS } from "./constants";
import { studioDateKey, studioDateTime, studioDateTimeWithTime } from "./studio-time";
import type { ConfirmedBooking, BookingRequest } from "./types/database";

export function generateReference(bookingId: string): string {
  return `SHEDIDTHAT-${bookingId.slice(0, 8).toUpperCase()}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(dateStr: string): string {
  return studioDateTimeWithTime(parseISO(dateStr));
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "d MMM yyyy");
}

export function formatTime(dateStr: string): string {
  return format(parseISO(dateStr), "HH:mm");
}

export interface TimeSlot {
  start: Date;
  end: Date;
  label: string;
}

/** True when an appointment overlaps a class on a supplied blocked timetable date. */
export function overlapsClassTimeBlock(start: Date, end: Date): boolean {
  const dateKey = studioDateKey(start);
  if (!CLASS_BLOCKED_DATE_RANGES.some(([rangeStart, rangeEnd]) => dateKey >= rangeStart && dateKey <= rangeEnd)) {
    return false;
  }
  const day = parseISO(dateKey);
  const weekday = day.getDay() || 7;
  const blocks = CLASS_TIME_BLOCKS[weekday as keyof typeof CLASS_TIME_BLOCKS];
  return Boolean(blocks?.some(([blockStart, blockEnd]) => {
    const blockedStart = studioDateTime(dateKey, blockStart);
    const blockedEnd = studioDateTime(dateKey, blockEnd);
    return isBefore(start, blockedEnd) && isAfter(end, blockedStart);
  }));
}

export function generateTimeSlots(
  date: Date,
  durationMinutes: number,
  confirmedBookings: Pick<ConfirmedBooking, "start_time" | "end_time">[],
  pendingBookings: Pick<BookingRequest, "start_time" | "end_time">[],
  unavailableSlots: Pick<BookingRequest, "start_time" | "end_time">[] = []
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const dateKey = studioDateKey(date);
  const now = new Date();
  const dayEnd = studioDateTime(dateKey, `${String(BUSINESS_HOURS.end).padStart(2, "0")}:00`);

  for (const time of APPOINTMENT_START_TIMES) {
    const slotStart = studioDateTime(dateKey, time);
    const slotEnd = addMinutes(slotStart, durationMinutes);

    // Do not offer a start time when the selected service would finish after closing.
    if (time !== AFTER_HOURS_START_TIME && isAfter(slotEnd, dayEnd)) continue;

    // Respect the supplied October class dates and timetable hours.
    if (overlapsClassTimeBlock(slotStart, slotEnd)) continue;

    // Skip past slots
    if (isAfter(slotStart, now) || slotStart.getTime() === now.getTime()) {
      // Check no overlap with confirmed bookings
      const hasConflict = confirmedBookings.some((booking) => {
        const bStart = parseISO(booking.start_time);
        const bEnd = parseISO(booking.end_time);
        return isBefore(slotStart, bEnd) && isAfter(slotEnd, bStart);
      });

      // Check no overlap with pending/POP_UPLOADED bookings
      const hasPendingConflict = pendingBookings.some((booking) => {
        const bStart = parseISO(booking.start_time);
        const bEnd = parseISO(booking.end_time);
        return isBefore(slotStart, bEnd) && isAfter(slotEnd, bStart);
      });

      const hasUnavailableSlot = unavailableSlots.some((booking) => {
        const bStart = parseISO(booking.start_time);
        const bEnd = parseISO(booking.end_time);
        return isBefore(slotStart, bEnd) && isAfter(slotEnd, bStart);
      });

      if (!hasConflict && !hasPendingConflict && !hasUnavailableSlot) {
        slots.push({
          start: slotStart,
          end: slotEnd,
          label: time,
        });
      }
    }
  }

  return slots;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
