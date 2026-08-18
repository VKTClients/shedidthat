import { format, parseISO } from "date-fns";

export interface CalendarAppointment {
  id: string;
  customer_name: string;
  email?: string | null;
  phone?: string | null;
  start_time: string;
  end_time: string;
  reference?: string | null;
  service_name?: string | null;
  notes?: string | null;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function formatLocalDateTime(value: string): string {
  return format(parseISO(value), "yyyyMMdd'T'HHmmss");
}

function formatUtcDateTime(value: string): string {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

export function createCalendarDataUri(appointment: CalendarAppointment): string {
  const service = appointment.service_name || "Hair appointment";
  const description = [
    `Client: ${appointment.customer_name}`,
    appointment.email ? `Email: ${appointment.email}` : null,
    appointment.phone ? `Phone: ${appointment.phone}` : null,
    appointment.reference ? `Reference: ${appointment.reference}` : null,
    appointment.notes || null,
  ]
    .filter(Boolean)
    .join("\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SheDidThat//Studio Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(appointment.id)}@shedidthat`,
    `DTSTAMP:${formatUtcDateTime(new Date().toISOString())}`,
    `DTSTART;TZID=Africa/Johannesburg:${formatLocalDateTime(appointment.start_time)}`,
    `DTEND;TZID=Africa/Johannesburg:${formatLocalDateTime(appointment.end_time)}`,
    `SUMMARY:${escapeIcsText(`SheDidThat · ${service}`)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    "LOCATION:SheDidThat Hair Studio",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
