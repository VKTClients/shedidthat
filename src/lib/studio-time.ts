import { addDays, format, parseISO } from "date-fns";
import { STUDIO_TIME_ZONE, STUDIO_UTC_OFFSET } from "./constants";

export function studioDateTime(dateKey: string, time: string) {
  return parseISO(`${dateKey}T${time}:00${STUDIO_UTC_OFFSET}`);
}

export function studioDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function studioTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: STUDIO_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function studioDayRange(dateKey: string) {
  const start = studioDateTime(dateKey, "00:00");
  const nextDateKey = format(addDays(parseISO(dateKey), 1), "yyyy-MM-dd");
  return { start, end: studioDateTime(nextDateKey, "00:00") };
}
