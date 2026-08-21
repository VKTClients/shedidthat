import { format, addMinutes, isBefore, isAfter, parseISO, startOfDay, endOfDay } from "date-fns";
import { BUSINESS_HOURS } from "./constants";
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
  return format(parseISO(dateStr), "EEE, d MMM yyyy 'at' HH:mm");
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

export function generateTimeSlots(
  date: Date,
  durationMinutes: number,
  confirmedBookings: Pick<ConfirmedBooking, "start_time" | "end_time">[],
  pendingBookings: Pick<BookingRequest, "start_time" | "end_time">[],
  unavailableSlots: Pick<BookingRequest, "start_time" | "end_time">[] = []
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const dayStart = startOfDay(date);
  const now = new Date();

  let current = addMinutes(dayStart, BUSINESS_HOURS.start * 60);
  const dayEnd = addMinutes(dayStart, BUSINESS_HOURS.end * 60);

  while (isBefore(addMinutes(current, durationMinutes), dayEnd) || 
         addMinutes(current, durationMinutes).getTime() === dayEnd.getTime()) {
    const slotStart = new Date(current);
    const slotEnd = addMinutes(current, durationMinutes);

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
          label: format(slotStart, "HH:mm"),
        });
      }
    }

    current = addMinutes(current, BUSINESS_HOURS.slotInterval);
  }

  return slots;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
