import { CalendarPlus } from "lucide-react";
import { createCalendarDataUri, type CalendarAppointment } from "@/lib/calendar";

export function AddToCalendarButton({
  appointment,
  compact = false,
}: {
  appointment: CalendarAppointment;
  compact?: boolean;
}) {
  return (
    <a
      href={createCalendarDataUri(appointment)}
      download={`shedidthat-${appointment.reference || appointment.id}.ics`}
      className={compact ? "admin-button admin-button-quiet admin-button-compact" : "admin-button admin-button-quiet"}
      title="Download an iCalendar file for this appointment"
    >
      <CalendarPlus className="h-4 w-4" />
      <span>Add to calendar</span>
    </a>
  );
}
